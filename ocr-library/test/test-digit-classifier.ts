
import * as tf from '@tensorflow/tfjs';
import { DigitClassifier } from 'ocr/digit-classifier/digit-classifier';


export class TestDigitClassifier extends DigitClassifier {

  override async init() {
    let modelPath: string;

    // Browser environment
    modelPath = './assets/digit_classifier_model/model.json';

    try {
      // Load the model from a URL
      this.model = await tf.loadLayersModel(modelPath);
    } catch (error) {
      console.error('Failed to load the model:', error);
      return;
    }

    console.log('Model loaded successfully.');
  }

}

async function test() {
  const digitClassifier = new TestDigitClassifier();
  await digitClassifier.init();

  // Generate a random digit matrix
  const digitMatrix = Array.from({ length: 14 }, () => Array.from({ length: 14 }, () => Math.random()));

  // Predict digit
  const prediction = await digitClassifier.predictDigit(digitMatrix);
  console.log('Predicted Digit:', JSON.stringify(prediction, null, 2));
}

test();
