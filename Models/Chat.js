const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    return sequelize.define("chat" , {
       //colonne de ma table dans la bdd
        name: Sequelize.STRING,
        message : Sequelize.STRING,
        room : Sequelize.STRING
    });
};