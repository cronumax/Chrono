import os
import requests
import webview
import logging
import time
import threading
import secrets
from datetime import datetime, timedelta
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
from pytz import timezone
from logging.handlers import TimedRotatingFileHandler


if platform.system() == 'Linux':
    app_file_path = '/usr/local/etc'
else:
    app_file_path = ''

if not os.path.exists('{0}/logs'.format(app_file_path)):
    os.makedirs('{0}/logs'.format(app_file_path))
if not os.path.exists('{0}/processes'.format(app_file_path)):
    os.makedirs('{0}/processes'.format(app_file_path))

log_handler = TimedRotatingFileHandler(
    '{0}/logs/Chrono.log'.format(app_file_path),
    when='midnight',
    backupCount=0  # 30 for production
)
log_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log_handler.setFormatter(log_formatter)
logger = logging.getLogger(__name__)
logger.addHandler(log_handler)
logger.setLevel(logging.DEBUG)


class Api:
    def __init__(self):
        self.version = '0.0.1'
        self.window = None
        self.api_url = 'http://localhost:8000/'
        self.current_user_email = None
        self.logged_in = False
        self.access_token = {}
        self.is_recording = False
        self.is_playing = False
        if pathlib.Path('{0}/Chrono.json'.format(app_file_path)).exists():
            with open('{0}/Chrono.json'.format(app_file_path)) as f:
                app = json.load(f)

            self.app_id = app['id']

            if app['version'] != self.version:
                self.register_or_update_app_version_info(app, 'update-app')
        else:
            app = {}
            self.app_id = app['id'] = secrets.token_urlsafe()
            self.register_or_update_app_version_info(app, 'register-app')
        '''
        To do: let user change these settings when we hv a gd error handling. Don't want dummy user action to backfire Cronumax/ Chrono's reputation.
        '''
        self.escape_key = Key.esc
        if platform.system() == 'Darwin':
            self.touch_mode = False
        else:
            self.touch_mode = True
        self.god_speed = False
        self.timezone = 'Hongkong'

    def register_or_update_app_version_info(self, app, endpt):
        app['version'] = self.version

        with open('{0}/Chrono.json'.format(app_file_path), 'w') as f:
            json.dump(app, f)

        res = requests.post(
            self.api_url + endpt, {'app_id': self.app_id, 'version': self.version}).json()

        logger.info(res['msg']) if res['status'] else logger.error(res['msg'])

    def renew_token(self):
        while self.logged_in:
            if datetime.strptime(self.access_token['expiry_date'], '%Y-%m-%d %H:%M:%S.%f%z').astimezone(timezone(self.timezone)) - datetime.now(timezone(self.timezone)) < timedelta(minutes=3) and self.access_token['email'] == self.current_user_email:
                res = requests.post(self.api_url + 'renew-token',
                                    {'code': self.access_token['code'], 'email': self.current_user_email, 'app_id': self.app_id}).json()

                if res['status']:
                    self.access_token['expiry_date'] = res['expiry_date']
                    logger.info(res['msg'])
                else:
                    logger.error(res['msg'])

            time.sleep(60)

    def send_email(self, type, email):
        return requests.post(self.api_url + 'send-email', {'type': type, 'email': email, 'app_id': self.app_id}).json()

    def login(self, email, pw):
        res = requests.post(self.api_url + 'login',
                            {'email': email, 'pw': pw, 'app_id': self.app_id}).json()

        if res['status']:
            self.logged_in = True
            self.current_user_email = email

            with open('{0}/Chrono.json'.format(app_file_path)) as f:
                app = json.load(f)
            app['user'] = email
            with open('{0}/Chrono.json'.format(app_file_path), 'w') as f:
                json.dump(app, f)

            response = requests.post(
                self.api_url + 'access-token', {'email': email, 'pw': pw, 'app_id': self.app_id}).json()

            if response['status']:
                self.access_token['code'] = response['code']
                self.access_token['expiry_date'] = response['expiry_date']
                self.access_token['email'] = response['email']
                thread = threading.Thread(
                    target=self.renew_token)
                thread.start()
            else:
                logger.error(response['msg'])

                return response
        else:
            logger.error(res['msg'])

        return res

    def logout(self):
        self.logged_in = False

        logger.info('{0} logged out'.format(self.current_user_email))

    def register(self, first_name, last_name, email, code, pw, agree_privacy_n_terms, send_update):
        try:
            response = requests.post(self.api_url + 'register', {'1st_name': first_name, 'last_name': last_name, 'email': email,
                                                                 'code': code, 'pw': pw, 'agree_privacy_n_terms': agree_privacy_n_terms, 'send_update': send_update, 'app_id': self.app_id}).json()

            if response['status']:
                self.logged_in = True
                self.current_user_email = email

                with open('{0}/Chrono.json'.format(app_file_path)) as f:
                    app = json.load(f)
                app['user'] = email
                with open('{0}/Chrono.json'.format(app_file_path), 'w') as f:
                    json.dump(app, f)

                res = requests.post(
                    self.api_url + 'access-token', {'email': email, 'pw': pw, 'app_id': self.app_id}).json()

                if res['status']:
                    self.access_token['code'] = res['code']
                    self.access_token['expiry_date'] = res['expiry_date']
                    self.access_token['email'] = res['email']
                    thread = threading.Thread(
                        target=self.renew_token)
                    thread.start()
                else:
                    logger.error(res['msg'])

                    return res
            else:
                logger.error(response['msg'])

            return response
        except Exception as e:
            logger.error('register() error: {0}'.format(str(e)))

    def reset_pw(self, new_pw, old_pw=None, code=None):
        if old_pw:
            return requests.post(self.api_url + 'reset-pw', {'new_pw': new_pw, 'old_pw': old_pw, 'email': self.current_user_email, 'app_id': self.app_id, 'code': self.access_token['code']}).json()
        else:
            return requests.post(self.api_url + 'reset-pw', {'new_pw': new_pw, 'code': code, 'app_id': self.app_id}).json()

    def forgot_pw(self, email):
        return requests.post(self.api_url + 'forgot-pw', {'email': email, 'app_id': self.app_id}).json()

    def navigate_to_dashboard(self):
        self.window.load_url('assets/index.html')

    def navigate_to_login(self):
        self.window.load_url('assets/ac.html')

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

    def play(self, msg, process_name):
        try:
            logger.info(msg)
            logger.info('User selected process: ' + process_name)

            if not self.is_playing:
                self.is_playing = True
                events = self.load(process_name)

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

    def save(self, process):
        try:
            logger.info('User proposed process name: ' + process)

            events = sorted(self.kb_events + self.m_events,
                            key=lambda i: i['time'])
            events.insert(0, {'owner': self.current_user_email})

            # To do: check file path consistency across OSes
            if pathlib.Path('{0}/processes/{1}.json'.format(app_file_path, process)).exists():
                status = False
                msg = 'Process {0} already exists locally.'.format(process)
            else:
                with open('{0}/processes/{1}.json'.format(app_file_path, process), 'w') as f:
                    json.dump(events, f)

                date = timezone(self.timezone).localize(datetime.fromtimestamp(pathlib.Path(
                    '{0}/processes/{1}.json'.format(app_file_path, process)).stat().st_mtime))
                response = requests.post(self.api_url + 'upload-process-meta-data', {
                    'email': self.current_user_email, 'name': process, 'date': date.strftime('%Y-%m-%d %H:%M:%S.%f%z'), 'app_id': self.app_id, 'code': self.access_token['code']}).json()

                if not response['status']:
                    logger.info(response['msg'])

                    return response
                else:
                    status = True
                    msg = 'Process {0} saved.'.format(process)

            logger.info(msg)

            return {'status': status, 'msg': msg}
        except Exception as e:
            logger.error('save() error: {0}'.format(str(e)))

    def load(self, process):
        try:
            with open('{0}/processes/{1}.json'.format(app_file_path, process)) as f:
                events = json.load(f)

            logger.info('Process {0} for user {1} loaded'.format(
                process, events[0]['owner']))
            events.pop(0)

            return events
        except Exception as e:
            logger.error('load() error: {0}'.format(str(e)))

    def rename_process(self, old_name, new_name):
        try:
            logger.info('User {0} proposed new name {1} for process {2}'.format(
                self.current_user_email, new_name, old_name))

            response = requests.post(self.api_url + 'rename-process', {
                'email': self.current_user_email, 'old_name': old_name, 'new_name': new_name, 'app_id': self.app_id, 'code': self.access_token['code']}).json()

            if response['status']:
                # Update local process name
                new_path = '{0}/processes/{1}.json'.format(
                    app_file_path, new_name)
                if pathlib.Path(new_path).exists():
                    status = False
                    msg = 'Process {0} already exists locally.'.format(
                        new_name)

                    res = requests.post(self.api_url + 'rename-process', {
                        'email': self.current_user_email, 'old_name': old_name, 'new_name': new_name, 'revert': True, 'app_id': self.app_id, 'code': self.access_token['code']}).json()

                    if res:
                        logger.info(res['msg'])
                    else:
                        logger.error(res['msg'])

                        return res
                else:
                    os.rename(
                        '{0}/processes/{1}.json'.format(app_file_path, old_name), new_path)

                    status = True
                    msg = 'Process {0} renamed to {1}.'.format(
                        old_name, new_name)

                logger.info(msg)

                return {'status': status, 'msg': msg}
            else:
                logger.error(response['msg'])

                return response
        except Exception as e:
            logger.error('rename_process() error: {0}'.format(str(e)))

            return {'status': False, 'msg': str(e)}

    def del_process(self, process):
        try:
            response = requests.post(
                self.api_url + 'del-process', {'email': self.current_user_email, 'name': process, 'app_id': self.app_id, 'code': self.access_token['code']}).json()

            if response['status']:
                # Del local process
                path = '{0}/processes/{1}.json'.format(app_file_path, process)
                if pathlib.Path(path).exists():
                    os.remove(path)

                    status = True
                    msg = 'Process {0} removed.'.format(process)
                else:
                    status = False
                    msg = 'Process {0} does not exist.'.format(process)
            else:
                logger.error(response['msg'])

                return response

            logger.info(msg)

            return {'status': status, 'msg': msg}
        except Exception as e:
            logger.error('del_process() error: {0}'.format(str(e)))

            return {'status': False, 'msg': str(e)}

    def load_process_list(self):
        try:
            process_list, process_names, raw_modified_times = (
                [] for i in range(3))
            response = requests.post(
                self.api_url + 'retrieve-process', {'email': self.current_user_email, 'app_id': self.app_id, 'code': self.access_token['code']}).json()
            for p in response:
                process_names.append(p['name'])
                raw_modified_times.append(datetime.strptime(
                    p['date'], '%Y-%m-%d %H:%M:%S.%f%z').astimezone(timezone(self.timezone)))

            # Check against local processes
            _, _, filenames = next(
                os.walk('{0}/processes/'.format(app_file_path)))
            if filenames:
                for n in filenames:
                    with open('{0}/processes/{1}'.format(app_file_path, n)) as f:
                        events = json.load(f)
                    if events[0]['owner'] != self.current_user_email:
                        filenames.remove(n)
                local_process_names = [n[:-5] for n in filenames]

                for i in range(len(process_names)):
                    if not process_names[i] in local_process_names:
                        process_names.pop(i)
                    elif raw_modified_times[i] != timezone(self.timezone).localize(datetime.fromtimestamp(pathlib.Path(
                            '{0}/processes/{1}.json'.format(app_file_path, process_names[i])).stat().st_mtime)):
                        logger.error('Process date mismatch')
                        process_names.pop(i)

            modified_times = []
            present = datetime.now(timezone(self.timezone))
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

            if not filenames:
                process_list = []

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
    api.window = webview.create_window('Chrono', 'assets/ac.html', js_api=api)
    webview.start(api.thread_handler, debug=True)
