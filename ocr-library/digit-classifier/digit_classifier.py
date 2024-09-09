import json
import numpy as np
import tensorflow as tf
import tensorflowjs as tfjs
from sklearn.model_selection import train_test_split
from sklearn.utils import resample
from tensorflow.keras import layers, models, Input
import matplotlib.pyplot as plt

# Step 1: Load the JSON directory files
def load_data(json_directory):
    data = {}
    for digit in range(10):
        with open(f'{json_directory}/{digit}.json', 'r') as file:
            data[digit] = json.load(file)
    return data

# Step 2: Balance the dataset
def balance_dataset(data):
    # Find the minimum length among all classes to balance
    min_samples = min(len(data[digit]) for digit in data)
    
    balanced_data = {digit: resample(data[digit], n_samples=min_samples, random_state=42) for digit in data}
    
    return balanced_data

# Step 3: Prepare the data for training and validation
def prepare_data(balanced_data, test_size=0.2):
    X = []
    y = []
    
    for digit, matrices in balanced_data.items():
        X.extend(matrices)
        y.extend([int(digit)] * len(matrices))
    
    # Convert to numpy arrays
    X = np.array(X).reshape(-1, 14, 14, 1)  # Adding channel dimension
    y = np.array(y)
    
    # Normalize the data (already between 0 and 1, so this step can be skipped if unnecessary)
    X = X.astype('float32')
    
    # One-hot encode the labels
    y = tf.keras.utils.to_categorical(y, num_classes=10)
    
    # Split into training and validation sets
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=test_size, random_state=42)
    
    return X_train, X_val, y_train, y_val

# Step 4: Build and train the CNN model
def build_and_train_model(X_train, X_val, y_train, y_val):

    inputs = Input(shape=(14, 14, 1))
    x = layers.Conv2D(32, (3, 3), activation='relu')(inputs)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Conv2D(64, (3, 3), activation='relu')(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Flatten()(x)
    x = layers.Dense(128, activation='relu')(x)
    outputs = layers.Dense(10, activation='softmax')(x)
    
    model = models.Model(inputs=inputs, outputs=outputs)
    
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    
    history = model.fit(X_train, y_train, epochs=10, batch_size=32, validation_data=(X_val, y_val))
    
    return model, history

# Step 5: Plot training and validation loss and accuracy
def plot_history(history):
    # Plot training & validation accuracy values
    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'])
    plt.plot(history.history['val_accuracy'])
    plt.title('Model accuracy')
    plt.ylabel('Accuracy')
    plt.xlabel('Epoch')
    plt.legend(['Train', 'Validation'], loc='upper left')
    
    # Plot training & validation loss values
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'])
    plt.plot(history.history['val_loss'])
    plt.title('Model loss')
    plt.ylabel('Loss')
    plt.xlabel('Epoch')
    plt.legend(['Train', 'Validation'], loc='upper left')
    
    plt.show()

# Main function to load, balance, prepare, and train the model
def main(json_directory):
    data = load_data(json_directory)
    balanced_data = balance_dataset(data)
    X_train, X_val, y_train, y_val = prepare_data(balanced_data)
    model, history = build_and_train_model(X_train, X_val, y_train, y_val)
    plot_history(history)
    return model

# Example usage
json_directory = 'digit-dataset'
trained_model = main(json_directory)

# Save the model if needed
trained_model.save('digit_classifier_model.h5')

#tfjs.converters.save_keras_model(trained_model, 'tfjs_model')
