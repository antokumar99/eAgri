const Research = require('../models/Research');

const ResearchController = {
    // Get all research papers
    getAllResearch: async (req, res) => {
        try {
            const research = await Research.find()
                .sort({ publishedDate: -1 }); // Sort by newest first

            // An empty collection is not an error. This used to return 404,
            // which sent ResearchScreen down its catch branch and showed
            // "Error fetching research papers" — even though the screen
            // already has a perfectly good "No research papers available"
            // empty state that could never be reached.
            res.status(200).json(research);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching research papers', error: error.message });
        }
    },

    // Add new research paper
    addResearch: async (req, res) => {
        try {
            const { title, link, category } = req.body;

            // Validate input
            if (!title || !link) {
                return res.status(400).json({ message: 'All fields (title, link, category) are required' });
            }

            if (!['Agriculture', 'Farming Technology', 'Crop Science', 'Soil Science', 'Other'].includes(category)) {
                return res.status(400).json({ message: 'Invalid category' });
            }

            // Create and save new research
            const newResearch = new Research({ title, link, category });
            const savedResearch = await newResearch.save();
            res.status(201).json(savedResearch);
        } catch (error) {
            res.status(500).json({ message: 'Error saving research paper', error: error.message });
        }
    }
};

module.exports = ResearchController;
