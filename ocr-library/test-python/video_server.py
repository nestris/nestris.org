import cv2
import argparse
from flask import Flask, jsonify

app = Flask(__name__)

def initialize_video(testcase):
    video_path = f"../test-cases/{testcase}/game.mov"
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise Exception("Could not open video file")

    # Get video info
    num_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    return cap, num_frames, width, height

@app.route('/info', methods=['GET'])
def info():
    if not hasattr(app, 'testcase'):
        return jsonify({"error": "Test case not set"}), 400
    
    info = {
        "frames": app.num_frames,
        "width": app.width,
        "height": app.height,
        "testcase": app.testcase
    }
    return jsonify(info)

@app.route('/frame/<int:frame>', methods=['GET'])
def frame(frame):
    if not hasattr(app, 'testcase'):
        return jsonify({"error": "Test case not set"}), 400

    if frame < 0 or frame >= app.num_frames:
        return jsonify({"error": "Invalid frame number"}), 400

    # Set the video position to the requested frame
    app.cap.set(cv2.CAP_PROP_POS_FRAMES, frame)
    ret, frame_data = app.cap.read()

    if not ret:
        return jsonify({"error": "Could not read frame"}), 500

    # Convert frame to RGB
    frame_rgb = cv2.cvtColor(frame_data, cv2.COLOR_BGR2RGB)

    # Create a 2D array of RGB values
    image = frame_rgb.tolist()

    return jsonify({"frame": frame, "image": image})

@app.route('/set/<string:testcase>', methods=['POST'])
def set_testcase(testcase):
    try:
        # Initialize video with the new testcase
        app.cap, app.num_frames, app.width, app.height = initialize_video(testcase)
        app.testcase = testcase  # Store the testcase name
        return jsonify({"message": "Test case set successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def main():
    app.run(port=5001)

if __name__ == '__main__':
    main()