import cv2
import argparse

def play_video(video_path: str):
    # Load video capture from file
    video = cv2.VideoCapture(video_path)
    
    cv2.namedWindow("Video", cv2.WINDOW_AUTOSIZE)

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

    while True:
        if playing:
            # Display the current frame
            if 0 <= frame_number < len(frames):
                cv2.imshow("Video", frames[frame_number])
            frame_number += 1
            if frame_number >= len(frames):
                frame_number = 0
        else:
            # Display the current frame
            if 0 <= frame_number < len(frames):
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
            frame_number = min(frame_number + 1, len(frames) - 1)
            playing = False

    # Release capture object and destroy all windows
    cv2.destroyAllWindows()

if __name__ == "__main__":
    argparser = argparse.ArgumentParser()
    argparser.add_argument("testcase", help="Name of the test case to visualize")
    
    args = argparser.parse_args()
    video_path = f"../test-cases/{args.testcase}/game.mov"
    play_video(video_path)
