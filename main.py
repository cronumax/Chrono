import webview
import logging
import keyboard as kb
import mouse as m
import time
import json
import pyautogui as pag


logging.basicConfig(filename='Chrono.log', level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', filemode='w')
logger = logging.getLogger(__name__)


class Api:
    def __init__(self):
        self.escape_key = 'esc'  # To do: let user select

    def record(self, msg):
        logger.info(msg)

        self.kb_events = []
        self.m_events = []

        kb.start_recording()
        m.hook(self.m_event_handler)
        kb.wait(self.escape_key)
        raw_kb_events = kb.stop_recording()
        m.unhook(self.m_event_handler)
        self.kb_event_handler(raw_kb_events)

        self.save()

        logger.info('Record finished.')

    def play(self, msg, god_speed=False):
        logger.info(msg)

        events = self.load()
        state = kb.stash_state()

        last_time = None
        for event in events:
            logger.info(event)

            if last_time and not god_speed:
                time.sleep(event['time'] - last_time)
            else:
                time.sleep(0.05)
            last_time = event['time']

            # Action
            if event['event_name'] == 'ButtonEvent':
                if event['event_type'] == 'up':
                    pag.mouseUp(
                        button=event['button'], x=event['position'][0], y=event['position'][1])
                else:
                    pag.mouseDown(
                        button=event['button'], x=event['position'][0], y=event['position'][1])
            else:
                key = event['name']
                if event['event_type'] == 'up':
                    kb.release(key)
                else:
                    kb.press(key)

        kb.restore_modifiers(state)

        logger.info('Replay finished.')

    def kb_event_handler(self, raw_kb_events):
        for e in raw_kb_events:
            kb_event_dict = {}
            kb_event_dict['event_name'] = 'KeyboardEvent'
            kb_event_dict.update(json.loads(e.to_json()))
            self.kb_events.append(kb_event_dict)

    def m_event_handler(self, raw_m_event):
        if isinstance(raw_m_event, m.ButtonEvent) and raw_m_event.button in ['?', 'left', 'middle', 'right']:
            m_event_dict = {}
            m_event_dict['event_name'] = 'ButtonEvent'
            m_event_dict['event_type'] = raw_m_event.event_type
            m_event_dict['button'] = 'left' if raw_m_event.button == '?' else raw_m_event.button
            m_event_dict['position'] = m.get_position()
            m_event_dict['time'] = raw_m_event.time
            self.m_events.append(m_event_dict)

    def save(self):
        events = sorted(self.kb_events + self.m_events,
                        key=lambda i: i['time'])

        # Fix escape_key pressing issue
        events.append({
            'event_name': 'KeyboardEvent',
            'event_type': 'up',
            'scan_code': events[-1]['scan_code'],
            'name': events[-1]['name'],
            'time': events[-1]['time'] + 0.1
        })

        # To do: dynamic file name
        with open('events.json', 'w') as f:
            json.dump(events, f)

    def load(self):
        # To do: dynamic file name
        with open('events.json') as f:
            events = json.load(f)

        return events

    def thread_handler(self):
        kb.unhook(kb.hook(set().add))
        kb.release(self.escape_key)


if __name__ == '__main__':
    api = Api()
    window = webview.create_window('Chrono', 'assets/index.html', js_api=api)
    webview.start(api.thread_handler)
