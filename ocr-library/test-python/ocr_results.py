from typing import List, Dict

"""
Stores the results dict from test-results.yaml, which holds all the information for an ocr test case at each frame.
"""
class OCRResults:

    def __init__(self, results: List[Dict]):
        self.results = results

        """
        A 200-bit binary string representing whether the mino exists in the frame.
        """

    def get_state_at_frame(self, frame: int) -> str:
        """
        Returns the state of the board at the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return ""
        
        return self.results[frame]["stateID"]

    def get_next_grid_point_at_frame(self, frame: int, minoIndex: int) -> bool:
        """
        Returns whether the next grid point is detected in the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return False
        
        if minoIndex < 0 or minoIndex >= 200:
            return False

        return self.results[frame]["nextGrid"][minoIndex] == "1"

    def get_mino_at_frame(self, frame: int, minoIndex: int) -> bool:
        """
        Returns whether the mino exists in the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return False
        
        if minoIndex < 0 or minoIndex >= 200:
            return False

        return self.results[frame]["binaryBoard"][minoIndex] == "1"
    
    def get_noise_at_frame(self, frame: int) -> float:
        """
        Returns the consistency of the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return -1

        return self.results[frame]["boardNoise"]
    
    def get_next_type_at_frame(self, frame: int) -> str:
        """
        Returns the type of the next mino in the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return ""
        if "nextType" not in self.results[frame]:
            raise Exception(f"nextType not found in frame {frame}")
        type = self.results[frame]["nextType"]
        if type == "E":
            return "Not found"
        return type
    
    def num_frames(self) -> int:
        return len(self.results)