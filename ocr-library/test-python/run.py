"""
This script is used to interface with a test case, both for viewing the video and test case data, as well as
calibrating the test case by setting the coordinates of the game board. To run the script, cd into this directory,
create a virtual environment, and install the requirements. Then, run the script with the following command:

python run.py <testcase> <mode>

The <testcase> argument is the name of the test case to run. The <mode> argument has multiple options:
- "calibrate": Set the calibration coordinates for the test case at a specific frame by clicking on the game board
- "bounds": View all the OCR bounds after running the calibration script
- "output": View the test output for the test case, including OCR results and state machine

"""

import cv2, yaml, argparse, os
from enum import Enum
from ocr_results import OCRResults

class Mode(Enum):
    CALIBRATE = "calibrate"
    BOUNDS = "bounds"
    OUTPUT = "output"

RED = (0, 0, 255)
GREEN = (0, 255, 0)
BLUE = (255, 0, 0)

POINT_GROUP_COLORS = {
    "board": RED,
    "shine": GREEN,
    "mino": BLUE
}

def calibrate(testcase: str, frame: int, x: int, y: int):
    """
    In the corresponding test case, save the coordinates at the given frame as the calibration configs
    """

    rel_path = f"../test-cases/{testcase}/config.yaml"

    # Read YAML and update the calibration values
    with open(rel_path, "r") as file:
        config = yaml.safe_load(file)
        config["calibration"]["frame"] = frame
        config["calibration"]["x"] = x
        config["calibration"]["y"] = y

    # Write the updated calibration values to YAML
    with open(rel_path, "w") as file:
        yaml.dump(config, file)

    print(f"Set calibration for {testcase} at frame {frame} with coordinates ({x}, {y})")


def update_frame_position(val):
    global frame_number
    frame_number = val

def play_video(testcase: str, mode: Mode):
    global frame_number

    WINDOW = f"{testcase}: {mode.value.upper()} mode"
    
    # Load video capture from file
    video = cv2.VideoCapture(f"../test-cases/{testcase}/game.mov")
    
    cv2.namedWindow(WINDOW, cv2.WINDOW_KEEPRATIO)


    def mouse_callback(event, x, y, flags, param):
        if event == cv2.EVENT_LBUTTONDOWN:
            if mode == Mode.CALIBRATE:
                calibrate(testcase, frame_number, x, y)
    cv2.setMouseCallback(WINDOW, mouse_callback)

    frame_number = 0
    playing = False
    frames = []

    
    # Read all frames from the video and store them in a list
    while video.isOpened():
        ret, frame = video.read()
        if not ret:
            break
        frames.append(frame)
    
    video.release()

    # if output, extract the OCR results from the test-results YAML from the test case
    if mode == Mode.OUTPUT:
        results_path = os.path.join(os.path.dirname(__file__), f"../test-output/{testcase}/test-results.yaml")
        calibration_plus_path = os.path.join(os.path.dirname(__file__), f"../test-output/{testcase}/calibration-plus.yaml")
        with (
            open(calibration_plus_path) as calibration_plus_file,
            open(results_path) as results_file
        ):
            calibration_plus = yaml.safe_load(calibration_plus_file)
            results_dict = yaml.safe_load(results_file)

        ocr_results = OCRResults(results_dict)

        for minoIndex, mino in enumerate(calibration_plus["points"]["shine"]):
            x, y = mino["x"], mino["y"]
            for frameIndex, frame in enumerate(frames):
                color = GREEN if ocr_results.get_mino_at_frame(frameIndex, minoIndex) else RED
                cv2.circle(frame, (x, y), 2, color, -1)



    # if in bounds, add bounding rect to each frame
    if mode == Mode.BOUNDS:
        calibration_path = os.path.join(os.path.dirname(__file__), f"../test-output/{testcase}/calibration.yaml")
        calibration_plus_path = os.path.join(os.path.dirname(__file__), f"../test-output/{testcase}/calibration-plus.yaml")

        with (
            open(calibration_path, "r") as calibration_file,
            open(calibration_plus_path, "r") as calibration_plus_file
        ):
            calibration = yaml.safe_load(calibration_file)
            calibration_plus = yaml.safe_load(calibration_plus_file)

            # Draw all bounding rects
            for rect_name, rect in calibration["rects"].items():
                x1 = rect["left"]
                y1 = rect["top"]
                x2 = rect["right"]
                y2 = rect["bottom"]
                for frame in frames:
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 1)

            # Draw all calibration points
            for group, points in calibration_plus["points"].items():
                for point in points:
                    x = point["x"]
                    y = point["y"]
                    for frame in frames:
                        cv2.circle(frame, (x, y), 1, POINT_GROUP_COLORS[group], -1)


    total_frames = ocr_results.num_frames() if ocr_results else len(frames)
    cv2.createTrackbar("Frame", WINDOW, 0, total_frames - 1, update_frame_position)

    # scale window down
    if False and frames:
        cv2.imshow(WINDOW, frames[0])
        cv2.resizeWindow(WINDOW, 800, 500)

    # Make the window appear on top of all other windows
    #cv2.setWindowProperty(WINDOW, cv2.WND_PROP_TOPMOST, 1)

    while True:

        if playing:
            if frame_number < total_frames:
                frame_number += 1
                cv2.setTrackbarPos("Frame", WINDOW, frame_number)
            else:
                playing = False
            
        # Display the current frame
        cv2.imshow(WINDOW, frames[frame_number])

        # Wait for user input
        key = cv2.waitKey(30)  # Adjust the delay for smoother playback

        # Control playback and frame navigation
        if key == ord('q'):
            break
        elif key == 32:  # Space bar
            playing = not playing
            if playing and frame_number == total_frames - 1:
                frame_number = 0
        elif key == 2555904:  # Left arrow key
            frame_number = max(frame_number - 1, 0)
            playing = False
        elif key == 2424832:  # Right arrow key
            frame_number = min(frame_number + 1, total_frames - 1)
            playing = False

    # Release capture object and destroy all windows
    cv2.destroyAllWindows()

if __name__ == "__main__":
    argparser = argparse.ArgumentParser()
    argparser.add_argument("testcase", help="Name of the test case to run")
    argparser.add_argument("mode", choices=[mode.value for mode in Mode], default="output", help="What action to perform")
    args = argparser.parse_args()

    play_video(args.testcase, Mode(args.mode))
