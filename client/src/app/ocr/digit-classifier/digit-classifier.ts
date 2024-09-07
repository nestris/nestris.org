import * as tf from '@tensorflow/tfjs';

export interface Prediction {
  digit: number;
  probability: number;
  probabilities: number[];
}

export abstract class DigitClassifier {

  protected model?: tf.LayersModel;

  // Inheriting classes must implement this method and initialize the model
  abstract init(): Promise<void>;

  isInitialized(): boolean {
    return !!this.model;
  }

  // Function to predict the digit from a 14x14 matrix
  async predictDigit(digitMatrix: number[][]): Promise<Prediction> {

    if (!this.model) {
      throw new Error('Model not loaded');
    }

    // Convert the input array to a Tensor
    const inputTensor = tf.tensor4d(digitMatrix.flat(), [1, 14, 14, 1]);

    // Make a prediction
    const prediction = this.model.predict(inputTensor) as tf.Tensor;

    // Convert prediction tensor to array
    const probabilities = await prediction.array() as number[][];

    // Find the digit with the highest probability
    const digit = probabilities[0].reduce((maxIndex, probability, index, arr) => 
      probability > arr[maxIndex] ? index : maxIndex, 0
    );

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