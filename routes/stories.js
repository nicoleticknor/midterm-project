const express = require('express');
const router  = express.Router();
const randomstring = require("randomstring");
const { getStoriesByGenre, getContributionsByStoryId, getStoryById, getStoryOfTheWeek } = require('../queries/story_queries')

module.exports = (db) => {
  router.get('/', (req, res) => {
    let query = getStoryById;
    db.query(query, [1])
      .then(data => {
        const story = data.rows[0].title;
        console.log('story', data.rows);
        const templateVars = {
          title: story
        };
        console.log(templateVars);
        res.render('stories', templateVars);
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });

  });

  router.get('/:story_id', (req, res) => {
    const getStory = `
    SELECT title, users.name AS author, content
    FROM stories
    JOIN users ON author_id = users.id
    WHERE stories.id = $1
    LIMIT 1;
    `;
    const getContributions = `
    SELECT upvotes, content, users.name
    FROM contributions
    JOIN users ON contributor_id = users.id
    WHERE story_id = $1;
    `
    const id = req.params.story_id;
    const templateVars = {};
    db.query(getStory, [id])
      .then(data => {
        const story = data.rows[0];
        templateVars.title = story.title;
        templateVars.content = story.content;
        templateVars.author = story.author;
      })
      .then(() => {
        db.query(getContributions, [id])
          .then(data => {
            templateVars.contributions = data.rows;
            res.render('story', templateVars);
        })
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });

  });

  router.get('/:story_id/:contribution_id', (req, res) => {

  });

  router.post('/:story_id', (req, res) => {

  });

  router.post('/:story_id/:contribution_id', (req, res) => {
    console.log(req.body)
  });

  router.post('/stories', (req, res) => {

  });

  router.post('/stories/:story_id/:contribution_id', (req, res) => {

  });

  return router;
};
