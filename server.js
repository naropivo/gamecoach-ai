const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5173;

// Теперь мы явно указываем, что статика лежит в папке frontend/dist
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// И здесь тоже поправляем путь к index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));