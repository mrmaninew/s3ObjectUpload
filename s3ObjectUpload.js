'use strict';
const AWS = require('aws-sdk'),
    config = require('../../../config/aws/awsConfig'),
    multer = require('multer'),
    uuid = require('node-uuid'),
    request = require('request'),
    gm = require('gm').subClass({ imageMagick: true }),
    multerS3 = require('multer-s3');

AWS.config.update({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region
});

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
var params = {};
params.Bucket = config.bucket_name;

var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.bucket_name,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, uuid.v1() + file.originalname);
        }
    })
}).single('file');

module.exports = {
    uploadObject: function () {
        return upload;
    },
    resizeVesselObject: function (file, cb) {
        // Thumbnails
        gm(request(file.location))
            .resize('200', '200')
            .toBuffer(function (err, stdout) {
                s3.upload({
                    Bucket: config.bucket_name,
                    Key: uuid.v1() + file.originalname,
                    ContentType: file.contentType,
                    Body: new Buffer(stdout, "binary")
                }, function (err, data) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, data);
                    }
                });
            });
    },
    resizeUserImage: function (file, cb) {
        // Thumbnails
        gm(request(file.location))
            .resize('50', '50')
            .toBuffer(function (err, stdout, stderr) {
                s3.upload({
                    Bucket: config.bucket_name,
                    Key: uuid.v1() + file.originalname,
                    ContentType: file.contentType,
                    Body: new Buffer(stdout, "binary")
                }, function (err, data) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, data);
                    }
                });
            });
    }
};