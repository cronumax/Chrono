import webview
import logging
from sneakysnek.recorder import Recorder
from sneakysnek.keyboard_event import KeyboardEvent
from sneakysnek.keyboard_keys import KeyboardKey
import time
import json
import pyautogui


logging.basicConfig(filename='Chrono.log', level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', filemode='w')
logger = logging.getLogger(__name__)


class Api:
    def __init__(self):
        self.is_recording = False
        self.touch_mode = True  # To do: let user choose between touch/ mouse mode

    def record(self, msg):
        logger.info(msg)

        self.event_strs = []

        if not self.is_recording:
            recorder = Recorder.record(self.event_handler)
            self.is_recording = True

            while self.is_recording:
                time.sleep(0.5)

            recorder.stop()

    def play(self, msg):
        logger.info(msg)

        event_strs = self.load()

        last_time = None
        for event_str in event_strs:
            tmp_list = event_str.split('.', 1)[1].split(' - ')
            event = {}

            # Parse event_str into event
            if 'MouseEvent' in event_str:
                event['name'] = 'mouse'
                event['type'] = tmp_list[0]
                event['button'] = tmp_list[1]
                event['direction'] = tmp_list[2]
                event['velocity'] = tmp_list[3]
                event['x'] = tmp_list[4]
                event['y'] = tmp_list[5]
                event['time'] = tmp_list[6]
            else:
                event['name'] = 'kb'
                event['type'] = tmp_list[0]
                event['keyboard_key'] = tmp_list[1]
                event['time'] = tmp_list[2]

            logger.info(event)

            # Action
            if last_time:
                time.sleep(float(event['time']) - last_time)
            last_time = float(event['time'])
            if event['name'] == 'mouse':
                if self.touch_mode:
                    pyautogui.click(int(event['x']), int(event['y']))
                else:
                    '''
                    To do
                    mouse mode
                    '''
            else:
                with open('keymap.json') as f:
                    keymap = json.load(f)
                key = keymap[event['keyboard_key']]
                if event['type'] == 'DOWN':
                    pyautogui.keyDown(key)
                else:
                    pyautogui.keyUp(key)

    def event_handler(self, event):
        event_str = event.__str__()
        logger.info(event_str)

        self.event_strs.append(event_str)
        if isinstance(event, KeyboardEvent) and event.keyboard_key == KeyboardKey.KEY_ESCAPE:
            self.is_recording = False
            self.save()

    def save(self):
        with open('events.json', 'w') as f:
            json.dump(self.event_strs, f)

    def load(self):
        with open('events.json') as f:
            event_strs = json.load(f)
        return event_strs


if __name__ == '__main__':
    api = Api()
    window = webview.create_window('Chrono', 'index.html', js_api=api)
    webview.start(debug=True)
