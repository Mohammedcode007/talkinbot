// Node.js function to add a new message to the JSON file
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'report.json');


function addMessage(to, msg, from, room) {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        return;
      }
      const jsonData = JSON.parse(data);
      jsonData.messages.push({ to, msg, from, room });
  
      fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          console.error('Error writing file:', err);
        } else {
          console.log('Message added successfully!');
        }
      });
    });
  }
module.exports = { addMessage };

