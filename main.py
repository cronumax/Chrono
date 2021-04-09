import webview
import logging
import time
import json
import platform
from pynput.keyboard import Key, KeyCode, Controller as kb_ctrler, Listener as kb_lstner
from pynput.mouse import Button, Controller as m_ctrler, Listener as m_lstner
if platform.system() == 'Linux':
    import subprocess as s
elif platform.system() == 'Darwin':
    import pync
    import AppKit
    import pyautogui as pag
else:
    pass


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
        logger.info(msg)

        if not self.is_recording:
            self.is_recording = True
            self.kb_events = []
            self.m_events = []

            while self.is_recording:
                time.sleep(1)

            self.save()

            logger.info('Record finished')
            if platform.system() == 'Linux':
                s.call(['notify-send', 'Chrono', 'Record finished.'])
            elif platform.system() == 'Darwin':
                pync.notify('Record finished.', title='Chrono')
            else:
                # To do
                pass

    def play(self, msg):
        logger.info(msg)

        if not self.is_playing:
            self.is_playing = True
            events = self.load()
            kc = kb_ctrler()
            mc = m_ctrler()

            last_time = None
            for event in events:
                logger.info(event)

                if last_time and not self.god_speed:
                    time.sleep(event['time'] - last_time)
                else:
                    time.sleep(0.05)
                last_time = event['time']

                # Action
                if event['event_name'] == 'KeyboardEvent':
                    if event['key']['char']:
                        key = event['key']['char']
                    else:
                        if platform.system() == 'Linux':
                            key = Key(KeyCode._from_symbol(event['key']['_symbol']))
                        elif platform.system() == 'Darwin':
                            key = Key(KeyCode.from_vk(event['key']['vk']))
                        else:
                            # To do
                            pass

                    if event['event_type'] == 'up':
                        kc.release(key)
                    else:
                        kc.press(key)
                else:
                    mc.position = event['position']
                    if event['event_name'] in ['TouchEvent', 'ClickEvent']:
                        btn = Button(event['button']['_value_']
                                     ) if 'button' in event else Button.left

                        if event['event_type'] == 'up':
                            mc.release(btn)
                        else:
                            mc.press(btn)
                    elif event['event_name'] == 'WheelEvent':
                        if event['event_type'] == 'up':
                            mc.scroll(0, 1)
                        else:
                            mc.scroll(0, -1)

            logger.info('Replay finished')
            if platform.system() == 'Linux':
                s.call(['notify-send', 'Chrono', 'Replay finished.'])
            elif platform.system() == 'Darwin':
                pync.notify('Replay finished.', title='Chrono')
            else:
                # To do
                pass
            self.is_playing = False

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

    def kb_event_handler(self, key, event_type, time):
        kb_event_dict = {}

        kb_event_dict['event_name'] = 'KeyboardEvent'
        kb_event_dict['event_type'] = event_type
        kb_event_dict['key'] = vars(
            vars(key)['_value_']) if '_value_' in vars(key) else vars(key)
        kb_event_dict['time'] = time

        self.kb_events.append(kb_event_dict)

    def m_event_handler(self, event_type, position, time, button=None):
        m_event_dict = {}

        if self.touch_mode:
            m_event_dict['event_name'] = 'TouchEvent'
        else:
            if button:
                m_event_dict['event_name'] = 'ClickEvent'

                btn = vars(button)
                btn.pop('__objclass__', None)

                if platform.system() == 'Darwin':
                    if btn['_value_'][1] == 0:
                        btn['_value_'] = 1
                    elif btn['_value_'][1] == 2:
                        btn['_value_'] = 2
                    elif btn['_value_'][1] == 1:
                        btn['_value_'] = 3

                m_event_dict['button'] = btn
            else:
                m_event_dict['event_name'] = 'WheelEvent'

        m_event_dict['event_type'] = event_type
        m_event_dict['position'] = position
        m_event_dict['time'] = time

        self.m_events.append(m_event_dict)

    def save(self):
        events = sorted(self.kb_events + self.m_events,
                        key=lambda i: i['time'])

        # To do: dynamic file name
        with open('events.json', 'w') as f:
            json.dump(events, f)

    def load(self):
        # To do: dynamic file name
        with open('events.json') as f:
            events = json.load(f)

        return events

    def thread_handler(self):
        self.kl = kb_lstner(on_press=self.on_press, on_release=self.on_release)
        self.ml = m_lstner(on_move=self.on_touch, on_click=self.on_click, on_scroll=self.on_scroll)
        self.kl.start()
        self.ml.start()


if __name__ == '__main__':
    api = Api()
    window = webview.create_window('Chrono', 'assets/index.html', js_api=api)
    webview.start(api.thread_handler)
