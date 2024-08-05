from typing import List, Dict
from dataclasses import dataclass

@dataclass
class EventStatus:
    name: str
    precondition_met: bool
    persistence_met: bool

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
    
    def get_event_statuses_at_frame(self, frame: int) -> List[EventStatus]:
        """
        Returns the event statuses at the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return []
        
        return [
            EventStatus(s["name"], s["preconditionMet"], s["persistenceMet"])
            for s in self.results[frame]["eventStatuses"]
        ]

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
    
    def get_noise_at_frame(self, frame: int) -> str:
        """
        Returns the consistency of the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return -1
        
        if "boardNoise" not in self.results[frame]:
            return "(Not fetched)"

        return str(self.results[frame]["boardNoise"])
    
    def get_next_type_at_frame(self, frame: int) -> str:
        """
        Returns the type of the next mino in the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return ""
        if "nextType" not in self.results[frame]:
            return "(Not fetched)"
        type = self.results[frame]["nextType"]
        if type == "E":
            return "Invalid type"
        return type

    def get_level_at_frame(self, frame: int) -> str:
        """
        Returns the level of the game at the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return ""
        if "level" not in self.results[frame]:
            return "(Not fetched)"
        
        level = self.results[frame]["level"]
        if level == -1:
            return "OCR could not detect level"
        return str(level)
    
    def get_board_only_type_at_frame(self, frame: int) -> str:
        """
        Returns type of the tetromino if there is precisely one tetromino on the board.
        """

        if frame < 0 or frame >= len(self.results):
            return ""
        if "boardOnlyType" not in self.results[frame]:
            return "(Not fetched)"
        
        type = self.results[frame]["boardOnlyType"]
        if type == "E":
            return "Board does not have exactly one tetromino"
        return type


    def get_packets_at_frame(self, frame: int) -> List[str]:
        """
        Returns the packets at the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return []
        
        return self.results[frame]["packets"]
    
    def num_frames(self) -> int:
        return len(self.results)