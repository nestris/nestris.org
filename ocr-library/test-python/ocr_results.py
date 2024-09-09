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

    def get_attribute_at_frame(self, frame: int, attribute: str) -> str:
        """
        Returns the attribute at the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return ""
        
        if attribute not in self.results[frame]:
            return "(Not fetched)"
        
        return self.results[frame][attribute]

    def get_state_at_frame(self, frame: int) -> str:
        """
        Returns the state of the board at the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return ""
        
        return self.results[frame]["stateID"]
    
    def get_relative_state_frame_count_at_frame(self, frame: int) -> int:
        """
        Returns the relative state frame count at the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return -1
        
        return self.results[frame]["stateFrameCount"]
    
    def get_state_count_at_frame(self, frame: int) -> int:
        """
        Returns the state count at the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return -1
        
        return self.results[frame]["stateCount"]
    
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
    
        if "binaryBoard" not in self.results[frame]:
            return False

        return self.results[frame]["binaryBoard"][minoIndex] == "1"
    
    def get_stable_board_mino_at_frame(self, frame: int, minoIndex: int) -> bool:
        """
        Returns whether the mino is detected on the StableBoard in the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return False
        
        if minoIndex < 0 or minoIndex >= 200:
            return False
        
        if "stableBoard" not in self.results[frame]:
            return False

        return self.results[frame]["stableBoard"][minoIndex] != "0"
    
    
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
    
    def get_logs_at_frame(self, frame: int) -> List[str]:
        """
        Returns the logs at the frame.
        """

        if frame < 0 or frame >= len(self.results):
            return []
        
        return self.results[frame]["textLogs"]
    
    def num_frames(self) -> int:
        return len(self.results)