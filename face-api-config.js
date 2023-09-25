const { createCanvas, loadImage, Image } = require("canvas");
const faceapi = require("face-api.js");
const canvas = createCanvas(600, 600);
faceapi.env.monkeyPatch({ Image, Canvas: canvas, ImageData: canvas });

// Load face detection models and options
const faceDetectionNet = faceapi.nets.ssdMobilenetv1;
const faceDetectionOptions = new faceapi.SsdMobilenetv1Options({
  minConfidence: 0.5,
});

module.exports = { canvas, faceDetectionNet, faceDetectionOptions };
