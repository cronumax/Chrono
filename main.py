import os
import webview
import logging
import time
from datetime import datetime
import json
import platform
import pathlib
from pynput.keyboard import Key, KeyCode, Controller as kb_ctrler, Listener as kb_lstner
from pynput.mouse import Button, Controller as m_ctrler, Listener as m_lstner
if platform.system() == 'Darwin':
    import AppKit
else:
    from plyer import notification
import pyautogui as pag


logging.basicConfig(filename='Chrono.log', level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', filemode='w')
logger = logging.getLogger(__name__)


class Api:
    def __init__(self):
        self.is_recording = False
        self.is_playing = False
        '''
        To do: let user change these settings when we hv a gd error handling. Don't want dummy user action to backfire Cronumax/ Chrono's reputation.
        '''
        self.escape_key = Key.esc
        if platform.system() == 'Darwin':
            self.touch_mode = False
        else:
            self.touch_mode = True
        self.god_speed = False

    def record(self, msg):
        try:
            logger.info(msg)

            if not self.is_recording:
                self.is_recording = True
                self.kb_events = []
                self.m_events = []

                while self.is_recording:
                    time.sleep(1)

                logger.info('Record finished')
                if platform.system() == 'Darwin':
                    title = 'Chrono'
                    message = 'Record finished.'
                    command = f'''
                    osascript -e 'display notification "{message}" with title "{title}"'
                    '''
                    os.system(command)
                else:
                    notification.notify(
                        title='Chrono', message='Record finished.')
        except Exception as e:
            logger.error('record() error: {0}'.format(str(e)))

    def play(self, msg):
        try:
            logger.info(msg)

            if not self.is_playing:
                self.is_playing = True
                events = self.load()

                last_time = None
                for event in events:
                    if not self.is_playing:
                        break

                    logger.info(event)

                    if last_time and not self.god_speed:
                        time.sleep(event['time'] - last_time)
                    else:
                        time.sleep(0.05)
                    last_time = event['time']

                    # Action
                    if event['event_name'] == 'KeyboardEvent':
                        if event['event_type'] == 'up':
                            pag.keyUp(event['key'])
                        else:
                            pag.keyDown(event['key'])
                    else:
                        if event['event_name'] in ['TouchEvent', 'ClickEvent']:
                            btn = event['button'] if 'button' in event else 'left'

                            if event['event_type'] == 'up':
                                pag.mouseUp(
                                    button=btn, x=event['position'][0], y=event['position'][1])
                            else:
                                pag.mouseDown(
                                    button=btn, x=event['position'][0], y=event['position'][1])
                        elif event['event_name'] == 'WheelEvent':
                            if event['event_type'] == 'up':
                                pag.scroll(
                                    1, x=event['position'][0], y=event['position'][1])
                            else:
                                pag.scroll(-1, x=event['position']
                                           [0], y=event['position'][1])

                logger.info('Replay finished')
                if platform.system() == 'Darwin':
                    title = 'Chrono'
                    message = 'Replay finished.'
                    command = f'''
                    osascript -e 'display notification "{message}" with title "{title}"'
                    '''
                    os.system(command)
                else:
                    notification.notify(
                        title='Chrono', message='Replay finished.')
                self.is_playing = False
        except Exception as e:
            logger.error('play() error: {0}'.format(str(e)))

    def on_press(self, key):
        if self.is_recording:
            logger.info('Pressed {0}'.format(key))

            self.kb_event_handler(key, 'down', time.time())

    def on_release(self, key):
        if self.is_recording:
            logger.info('Released {0}'.format(key))

            self.kb_event_handler(key, 'up', time.time())
            if key == self.escape_key:
                self.is_recording = False
        if self.is_playing:
            if key == self.escape_key:
                self.is_playing = False

    def on_touch(self, x, y):
        if self.touch_mode and self.is_recording:
            logger.info('Touched at {0}'.format((x, y)))

            self.m_event_handler('down', (x, y), time.time())
            self.m_event_handler('up', (x, y), time.time())

    def on_click(self, x, y, button, pressed):
        if self.is_recording:
            logger.info('{0} {1} at {2}'.format(
                'Pressed' if pressed else 'Released', button, (x, y)))

            if self.touch_mode:
                self.touch_mode = False

            event_type = 'down' if pressed else 'up'
            self.m_event_handler(event_type, (x, y), time.time(), button)

    def on_scroll(self, x, y, dx, dy):
        if self.is_recording:
            event_type = 'down' if dy < 0 else 'up'
            logger.info('Scrolled {0} at {1}'.format(event_type, (x, y)))

            if self.touch_mode:
                self.touch_mode = False

            self.m_event_handler(event_type, (x, y), time.time())

    def special_key_handler(self, key):
        try:
            key = self.kl.canonical(key)
            if hasattr(key, 'char'):
                key = key.char
            else:
                key = key.name

            # pynput's keys -> pyautogui's keys conversion
            if key == 'cmd':
                if platform.system() == 'Darwin':
                    key = 'command'
                else:
                    key = 'winleft'
            elif key == 'alt_l':
                key = 'altleft'
            elif key == 'alt_r':
                key = 'altright'
            elif key == 'shift_l':
                key = 'shiftleft'
            elif key == 'shift_r':
                key = 'shiftright'
            elif key == 'ctrl_l':
                key = 'ctrlleft'
            elif key == 'ctrl_r':
                key = 'ctrlright'
            elif key == 'caps_lock':
                key = 'capslock'
            elif key == 'page_down':
                key = 'pgdn'
            elif key == 'page_up':
                key = 'pgup'
            elif key == 'media_play_pause':
                key = 'playpause'
            elif key == 'media_volume_mute':
                key = 'volumemute'
            elif key == 'media_volume_down':
                key = 'volumedown'
            elif key == 'media_volume_up':
                key = 'volumeup'
            elif key == 'media_previous':
                key = 'prevtrack'
            elif key == 'media_next':
                key = 'nexttrack'
            elif key == 'num_lock':
                key = 'numlock'
            elif key == 'print_screen':
                key = 'printscreen'
            elif key == 'scroll_lock':
                key = 'scrolllock'

            return key
        except Exception as e:
            logger.error('special_key_handler() error: {0}'.format(str(e)))

    def kb_event_handler(self, key, event_type, time):
        kb_event_dict = {}

        kb_event_dict['event_name'] = 'KeyboardEvent'
        kb_event_dict['event_type'] = event_type
        kb_event_dict['key'] = self.special_key_handler(key)
        kb_event_dict['time'] = time

        if kb_event_dict['key']:
            self.kb_events.append(kb_event_dict)

    def m_event_handler(self, event_type, position, time, button=None):
        m_event_dict = {}

        if self.touch_mode:
            m_event_dict['event_name'] = 'TouchEvent'
        else:
            if button:
                m_event_dict['event_name'] = 'ClickEvent'
                m_event_dict['button'] = button.name
            else:
                m_event_dict['event_name'] = 'WheelEvent'

        m_event_dict['event_type'] = event_type
        m_event_dict['position'] = position
        m_event_dict['time'] = time

        self.m_events.append(m_event_dict)

    def save(self, process_name):
        try:
            logger.info('User proposed process name: ' + process_name)

            events = sorted(self.kb_events + self.m_events,
                            key=lambda i: i['time'])

            # To do: check file path consistency across OSes
            if pathlib.Path('processes/{0}.json'.format(process_name)).exists():
                saved = False
                txt = 'Process with the same name already exists.'
            else:
                with open('processes/{0}.json'.format(process_name), 'w') as f:
                    json.dump(events, f)

                saved = True
                txt = 'Process saved.'

            logger.info(txt)

            return {'saved': saved, 'txt': txt}
        except Exception as e:
            logger.error('save() error: {0}'.format(str(e)))

    def load(self):
        # To do: dynamic file name
        with open('processes/events.json') as f:
            events = json.load(f)

        return events

    def load_process_list(self):
        try:
            process_list = []
            _, _, filenames = next(os.walk('processes/'))
            process_names = [n[:-5] for n in filenames]
            raw_modified_times = [datetime.fromtimestamp(pathlib.Path(
                'processes/' + n).stat().st_mtime) for n in filenames]

            modified_times = []
            present = datetime.now()
            for t in raw_modified_times:
                if t.year != present.year:
                    modified_times.append(t.strftime('%d %b %Y'))
                elif t.month != present.month or (t.month == present.month and present.day - t.day >= 7):
                    modified_times.append(t.strftime('%d %b'))
                elif 0 < present.day - t.day < 7:
                    if present.day - t.day == 1:
                        modified_times.append('Yesterday')
                    else:
                        modified_times.append(t.strftime('%a'))
                else:
                    modified_times.append(t.strftime('%H:%M'))

            for i in range(len(process_names)):
                process_list.append([process_names[i], modified_times[i]])

            logger.info(process_list)

            return process_list
        except Exception as e:
            logger.error('load_process_list() error: {0}'.format(str(e)))

    def thread_handler(self):
        try:
            pag.keyUp('esc')  # Hot fix for macOS thread issue
            with kb_lstner(on_press=self.on_press, on_release=self.on_release) as self.kl, m_lstner(on_move=self.on_touch, on_click=self.on_click, on_scroll=self.on_scroll) as self.ml:
                self.kl.join()
                self.ml.join()
        except Exception as e:
            logger.error('thread_handler() error: {0}'.format(str(e)))


if __name__ == '__main__':
    api = Api()
    window = webview.create_window('Chrono', 'assets/index.html', js_api=api)
    webview.start(api.thread_handler, debug=True)
