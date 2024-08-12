import * as tf from '@tensorflow/tfjs';
import * as path from 'path';
import * as fs from 'fs';

// If in Node.js environment, load the tfjs-node backend
if (typeof window === 'undefined') {
  require('@tensorflow/tfjs-node');
}

export interface Prediction {
  digit: number;
  probability: number;
  probabilities: number[];
}

export class DigitClassifier {

  private model!: tf.LayersModel;

  async init() {
    const modelPath = 'ocr/digit-classifier/digit_classifier_model/model.json';
    const absoluteModelPath = `file://${path.resolve(modelPath)}`;

    // Check if the file exists at the path
    if (!fs.existsSync(path.resolve(modelPath))) {
      console.error('Model file does not exist at:', absoluteModelPath);
      return;
    }
    console.log('Model file found at:', absoluteModelPath);

    // Load the model
    this.model = await tf.loadLayersModel(absoluteModelPath);
    console.log('Model loaded successfully.');
  }

  // Function to predict the digit from a 14x14 matrix
  async predictDigit(digitMatrix: number[][]): Promise<Prediction> {
    // Convert the input array to a Tensor
    // Ensure digitMatrix is of shape [14, 14]
    const inputTensor = tf.tensor4d(digitMatrix.flat(), [1, 14, 14, 1]);

    // Make a prediction
    const prediction = this.model.predict(inputTensor) as tf.Tensor;

    // Convert prediction tensor to array
    const probabilities = await prediction.array() as number[][];

    // Find the digit with the highest probability
    const digit = probabilities[0].reduce((maxIndex, probability, index, arr) => probability > arr[maxIndex] ? index : maxIndex, 0);

    // Dispose of tensors to free up memory
    inputTensor.dispose();
    prediction.dispose();

    return {
      digit,
      probability: probabilities[0][digit],
      probabilities: probabilities[0]
    };
  }
}

async function test() {
  const digitClassifier = new DigitClassifier();
  await digitClassifier.init();

  // generate random digit matrix
  const digitMatrix = Array.from({ length: 14 }, () => Array.from({ length: 14 }, () => Math.random()));

  // predict digit
  const prediction = await digitClassifier.predictDigit(digitMatrix);
  console.log('Predicted Digit:', JSON.stringify(prediction, null, 2));
}

test();