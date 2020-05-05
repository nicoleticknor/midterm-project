const express = require('express');
const router = express.Router();
const rp = require('request-promise-native');

const { selectAllStories,
  getCompleteStoryById,
  getIncompleteStoryById,
  getActiveContributions
} = require('../queries/stories_get_queries');

const {
  createNewStory,
  markStoryComplete,
} = require('../queries/stories_post_queries');

const { getContributionsByStoryId,
  createContribution,
  renderNewContribution,
  mergeContribution1,
  mergeContribution2,
  getContributionById
} = require('../queries/contributions_queries');

/**************ESSENTIAL ROUTES***************
 * GET / -- done with hardcoding
 * POST / -- done
 * POST /update (for writing prompt api) // TODO needs FE implmnt'n
 * GET /:story_id  -- done
 * GET /:story_id/contributions
 * POST /:story_id/contributions
 * POST /:story_id/contributions/:contribution_id -- done
 */

module.exports = (db) => {
  //browse all stories
  router.get('/', (req, res) => {
    res.render('stories');
  });

  //create a new story
  router.post('/', (req, res) => {
    const authorId = req.body.author_id;
    const title = req.body.title;
    const content = req.body.content;
    db.query(createNewStory, [content, title, authorId])
      .then(() => {
        const templateVars = {
          title,
          content,
          author_id: authorId
        };
        res.render('story', templateVars);
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  //generate a writing prompt
  //TODO implement in FE
  router.post('/update', (req, res) => {
    const options = {
      uri: 'https://ineedaprompt.com/dictionary/default/prompt?q=adj+noun+adv+verb+noun+location',
      json: true
    };

    rp(options)
      .then((data) => {
        console.log(data.english);
        res.json(data);
        // jQ requests this route; this is returned; then update with that json
      })
      .catch((err) => {
        console.log(err);
      });
  });

  // read a complete story
  router.get('/:story_id', (req, res) => {
    console.log(req.params)
    const query = getCompleteStoryById;
    const id = req.params.story_id;
    db.query(query, [id])
      .then(data => {
        const story = data.rows[0];

        const templateVars = {
          title: story.title,
          content: story.content,
          author: story.name,
          complete: true,
          id
        };
        res.render('story', templateVars);
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  //read an incomplete story
  router.get('/:story_id/contributions', (req, res) => {
    const query1 = getActiveContributions;
    const query2 = getIncompleteStoryById;
    const id = req.params.story_id;
    const templateVars = { loggedIn: false, complete: false };
    if (req.session.user) templateVars.loggedIn = true;
    db.query(query1, [id])
      .then(data => {
        templateVars['contributions'] = data.rows;
        db.query(query2, [id])
          .then(data => {
            const story = data.rows[0];
            templateVars.title = story.title;
            templateVars.content = story.content;
            templateVars.author = story.name;
            templateVars.id = id;
            res.render('story', templateVars);
          })
          .catch(err => {
            res
              .status(500)
              .json({ error: err.message });
          });
      });
  });

  //create a new contribution to a story
  router.post('/:story_id/contributions', (req, res) => {
    const query1 = createContribution;
    const query2 = renderNewContribution;
    const storyId = req.body.story_id;
    const contributor_id = req.session.user;
    const content = req.body.content;

    db.query(query1, [storyId, content, contributor_id])
      .then((data) => {
        const contributionId = data.rows[0].id;
        db.query(query2, [contributionId])
          .then((data) => {
            const result = JSON.stringify(data.rows[0]);
            res.end(result);
          })
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  //append a contribution to a story
  router.post('/:story_id/contributions/:contribution_id', (req, res) => {
    const contribution_id = req.params.contribution_id;
    const story_id = req.params.story_id;

    //grab existing story content to a var
    db.query(getCompleteStoryById, [story_id])
      .then(data => {
        return data.rows[0].content;
      })
      // append var with target contribution content
      .then(mergeContent => {
        return db.query(getContributionById, [contribution_id])
          .then(data => {
            return mergeContent += ' ' + data.rows[0].content;
          })
      })

      //Update story content in DB
      .then(mergeContent => {
        return db.query(mergeContribution1, [contribution_id])
          .then(() => {
            return db.query(`
        UPDATE stories SET content = $1
        WHERE stories.id = $2;`, [mergeContent, story_id])
          })
      })
      .then(() => {
        //update all contribution statuses related to that story
        return db.query(mergeContribution2, [story_id])
      })
      .then(() => {
        res.status(201).send();
      })
      .catch(err => {
        console.log(err)
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  return router;
};


/*******NON-ESSENTIAL ROUTES*********
 * place these in the router as you build them out



  //edit a story's title or content NOT by merge
  router.post('/:story_id', (req, res) => {

  });

  //mark a story complete
  router.post('/:story_id/complete', (req, res) => {

  });

  //delete a story
  router.post('/:story_id/delete', (req, res) => {

  });



  //read a contribution
  router.get('/:story_id/contributions/:contribution_id', (req, res) => {

  });


     */