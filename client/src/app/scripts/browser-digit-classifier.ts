import { DigitClassifier } from "../ocr/digit-classifier/digit-classifier";
import * as tf from '@tensorflow/tfjs';

export class BrowserDigitClassifer extends DigitClassifier {

    override async init(): Promise<void> {

        let modelPath: string;
        let startLoadTime: number = Date.now();

        // Browser environment
        modelPath = './assets/digit_classifier_model/model.json';

        try {
            // Load the model from a URL
            this.model = await tf.loadLayersModel(modelPath);
        } catch (error) {
            console.error('Failed to load the model:', error);
            return;
        }

        console.log('Model loaded successfully in', Date.now() - startLoadTime, 'ms');

    }

}