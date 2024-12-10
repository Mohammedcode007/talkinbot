const fs = require('fs');
const path = require('path');

const getInstructions = () => {
    const filePath = path.join(__dirname, 'instructions.json');
    try {
        const data = fs.readFileSync(filePath, 'utf-8'); // قراءة الملف
        const parsedData = JSON.parse(data);
        return parsedData.instructions || [];
    } catch (err) {
        console.error('Error reading instructions file:', err);
        return [];
    }
};

const getRandomInstruction = () => {
    const instructions = getInstructions();
    if (!Array.isArray(instructions) || instructions.length === 0) {
        throw new Error('The instructions array is empty or invalid.');
    }
    const randomIndex = Math.floor(Math.random() * instructions.length);
    return instructions[randomIndex];
};

module.exports = {
    getRandomInstruction,
};
