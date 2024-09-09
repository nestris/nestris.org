import os

def find_video_file(directory_path):
    # Check if the provided path is a valid directory
    if not os.path.isdir(directory_path):
        raise ValueError("The provided path is not a valid directory")

    # Iterate over the files in the directory
    for file_name in os.listdir(directory_path):
        # Check if the file has a .mov or .mp4 extension
        if file_name.lower().endswith(('.mov', '.mp4')):
            # Return the full path to the video file
            return os.path.join(directory_path, file_name)

    raise FileNotFoundError("No video file found in the directory")

if __name__ == "__main__":
    directory_path = "../test-cases/Case1"
    try:
        video_file = find_video_file(directory_path)
        print(f"Found video file: {video_file}")
    except FileNotFoundError as e:
        print(f"Error: {e}")
    except ValueError as e:
        print(f"Error: {e}")