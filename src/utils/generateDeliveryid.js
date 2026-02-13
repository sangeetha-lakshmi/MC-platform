module.exports = (name) => {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  const cleanName = name.toLowerCase().replace(/\s+/g, "");
  return cleanName + randomNumber;
};
