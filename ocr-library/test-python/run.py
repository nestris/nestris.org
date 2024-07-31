import cv2, yaml, argparse, os
from enum import Enum

class Mode(Enum):
    CALIBRATE = "calibrate"
    VIEW = "view"


def calibrate(testcase: str, frame: int, x: int, y: int):
    """
    In the corresponding test case, save the coordinates at the given frame as the calibration configs
    """

    rel_path = f"../test-cases/{testcase}/config.yaml"
    full_path = os.path.join(os.path.dirname(__file__), rel_path)

    # Read YAML and update the calibration values
    with open(full_path, "r") as file:
        config = yaml.safe_load(file)
        config["calibration"]["frame"] = frame
        config["calibration"]["x"] = x
        config["calibration"]["y"] = y

    # Write the updated calibration values to YAML
    with open(full_path, "w") as file:
        yaml.dump(config, file)

    print(f"Set calibration for {testcase} at frame {frame} with coordinates ({x}, {y})")

def update_frame_position(val):
    global frame_number
    frame_number = val

def play_video(testcase: str, mode: Mode):
    global frame_number
    
    # Load video capture from file
    video = cv2.VideoCapture(f"../test-cases/{testcase}/game.mov")
    
    cv2.namedWindow("Video", cv2.WINDOW_KEEPRATIO)


    def mouse_callback(event, x, y, flags, param):
        if event == cv2.EVENT_LBUTTONDOWN:
            if mode == Mode.CALIBRATE:
                calibrate(testcase, frame_number, x, y)

    cv2.setMouseCallback("Video", mouse_callback)

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

    total_frames = len(frames)
    cv2.createTrackbar("Frame", "Video", 0, total_frames - 1, update_frame_position)

    # scale window down
    if frames:
        cv2.imshow("Video", frames[0])
        cv2.resizeWindow("Video", 800, 500)

    # Make the window appear on top of all other windows
    #cv2.setWindowProperty("Video", cv2.WND_PROP_TOPMOST, 1)

    while True:
        if playing:
            # Display the current frame
            if 0 <= frame_number < total_frames:
                cv2.imshow("Video", frames[frame_number])
            frame_number += 1
            if frame_number >= total_frames:
                frame_number = 0
            cv2.setTrackbarPos("Frame", "Video", frame_number)
        else:
            # Display the current frame
            if 0 <= frame_number < total_frames:
                cv2.imshow("Video", frames[frame_number])
        
        # Wait for user input
        key = cv2.waitKey(30)  # Adjust the delay for smoother playback

        # Control playback and frame navigation
        if key == ord('q'):
            break
        elif key == 32:  # Space bar
            playing = not playing
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
    argparser.add_argument("mode", choices=[mode.value for mode in Mode], default="view", help="What action to perform")
    args = argparser.parse_args()

    play_video(args.testcase, Mode(args.mode))
