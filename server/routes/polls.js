const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const { generateDeviceHash } = require('../utils/helpers');

/**
 * POST /api/polls/:confessionId/vote
 * Vote on a poll option
 */
router.post('/:confessionId/vote', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { optionIndex } = req.body;
    const deviceHash = generateDeviceHash(req);

    const confession = await Confession.findOne({
      _id: confessionId,
      isPoll: true,
      expiresAt: { $gt: new Date() }
    });

    if (!confession) {
      return res.status(404).json({ error: { message: 'Poll not found or expired' } });
    }

    if (optionIndex < 0 || optionIndex >= confession.pollOptions.length) {
      return res.status(400).json({ error: { message: 'Invalid option' } });
    }

    // Check if user already voted
    const hasVoted = confession.pollOptions.some(opt => 
      opt.voters.includes(deviceHash)
    );

    if (hasVoted) {
      // Remove previous vote
      confession.pollOptions.forEach(opt => {
        const voterIndex = opt.voters.indexOf(deviceHash);
        if (voterIndex > -1) {
          opt.voters.splice(voterIndex, 1);
          opt.votes = Math.max(0, opt.votes - 1);
        }
      });
    }

    // Add new vote
    confession.pollOptions[optionIndex].voters.push(deviceHash);
    confession.pollOptions[optionIndex].votes += 1;

    await confession.save();

    // Calculate total votes and percentages
    const totalVotes = confession.pollOptions.reduce((sum, opt) => sum + opt.votes, 0);
    const pollResults = confession.pollOptions.map(opt => ({
      text: opt.text,
      votes: opt.votes,
      percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
    }));

    res.json({
      success: true,
      voted: true,
      votedOption: optionIndex,
      pollResults,
      totalVotes
    });

  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ error: { message: 'Failed to vote on poll' } });
  }
});

/**
 * GET /api/polls/:confessionId/results
 * Get poll results
 */
router.get('/:confessionId/results', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const deviceHash = generateDeviceHash(req);

    const confession = await Confession.findOne({
      _id: confessionId,
      isPoll: true
    }).select('pollOptions');

    if (!confession) {
      return res.status(404).json({ error: { message: 'Poll not found' } });
    }

    const totalVotes = confession.pollOptions.reduce((sum, opt) => sum + opt.votes, 0);
    const userVotedOption = confession.pollOptions.findIndex(opt => 
      opt.voters.includes(deviceHash)
    );

    const pollResults = confession.pollOptions.map(opt => ({
      text: opt.text,
      votes: opt.votes,
      percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
    }));

    res.json({
      success: true,
      pollResults,
      totalVotes,
      hasVoted: userVotedOption !== -1,
      votedOption: userVotedOption !== -1 ? userVotedOption : null
    });

  } catch (error) {
    console.error('Error fetching poll results:', error);
    res.status(500).json({ error: { message: 'Failed to fetch poll results' } });
  }
});

module.exports = router;
