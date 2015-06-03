var mongoose = require('mongoose');
var connection = mongoose.createConnection('mongodb://localhost/oim');
var url = 'mongodb://localhost:27017/oim';
var MongoClient = require('mongodb').MongoClient;
var async = require("async");

var Project = function (data) {
    this.data = data;
};

Project.MODEL_NAME = "project";

Project.PROJECT_SCHEMA = new mongoose.Schema({
    projectName: { type : String, required : true },
    userProject: { type : String, required : true },
    dateCreation: {type: Date, default: Date.now()},
    dateLastUpdate: {type: Date, default: Date.now()}
});

Project.prototype.data = {};    //json

Project.getProject = function (projectName, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Projects = connection.model(Project.MODEL_NAME, Project.PROJECT_SCHEMA);

    Projects.findOne( {projectName: projectName },
        function (err, doc)
        {
            console.log("CALL getProject -> findOne ( doc is " + doc +")");
            connection.close();
            callback(doc);
        }
    );
};

Project.getProjects = function(username, callback)
{
    var ProjectModel = connection.model(Project.MODEL_NAME, Project.PROJECT_SCHEMA);

    ProjectModel.find()
        .lean()
        .exec( function(err, docs)
    {
        if (err) {
            callback(null);
        }
        else
        {
            callback(docs);
        }
    });


};

Project.addProject = function(dataProject, callback)
{
    var Project = require("../model/Project");
    var mongoose = require('mongoose');

    console.log("CALL Project.addProject");

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    Model = connection.model(Project.MODEL_NAME, Project.PROJECT_SCHEMA);
    var newProject = new Model(dataProject);

    newProject.save(
        function(err)
        {
            connection.close();
            callback(err);
        }
    );

};

/**
 * @param projectName
 * @param callback - { fn(  {status:Number, message:String, deletedCount:Number}  )
 */
Project.delProject = function(projectName, callback)
{
    MongoClient.connect(url, function(err, db) {
        if(err!=null)
        {
            callback({status:1, message:err.toString(), contDeleted: 0});
        }
        else
        {
            var datas = db.collection('datas');
            var projects = db.collection('projects');

            async.parallel({
                deletedCount: function(parallel){
                    setTimeout(function(){
                        datas.removeMany({projectName: projectName}, function(err, ris)
                        {
                            //{status:0, message:"", deletedCount:
                            if ( err == null )
                                parallel(null, ris.deletedCount);
                            else
                                parallel(err.toString());
                        });
                    }, 1);
                },
                project: function(parallel){
                    setTimeout(function(){
                        projects.removeOne({projectName: projectName}, function(err, ris)
                        {
                            if ( err == null )
                                parallel(null, ris.deletedCount);
                            else
                                parallel(err.toString());
                        });
                    }, 1);
                }
            },

            function(err, results) {

                if(err == null)
                    callback(null, {status:0, message:"", deletedCount: results.deletedCount});
                else
                    callback(err, {status:1, message:err, deletedCount: 0});

                db.close();
            });
        }
    });
};

module.exports = Project;