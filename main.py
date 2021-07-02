import os
import requests
import webview
import logging
from time import time, sleep
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
from pytz import timezone, common_timezones
from logging.handlers import TimedRotatingFileHandler
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED
from dateutil.relativedelta import relativedelta


if platform.system() == 'Windows':
    app_file_path = '/ProgramData/Chrono'
else:
    app_file_path = '/usr/local/etc'

if not os.path.exists('{0}/logs'.format(app_file_path)):
    os.makedirs('{0}/logs'.format(app_file_path))
if not os.path.exists('{0}/processes'.format(app_file_path)):
    os.makedirs('{0}/processes'.format(app_file_path))
if not os.path.exists('{0}/settings'.format(app_file_path)):
    os.makedirs('{0}/settings'.format(app_file_path))

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
        logger.info('Chrono started')

        self.version = '1.0.2'
        self.window = None
        self.api_url = 'https://chrono.cronumax.com/'
        self.current_user_email = None
        self.logged_in = False
        self.access_token = {}
        self.is_recording = False
        self.is_playing = False
        self.is_repeating = False
        self.schedule_repeat_msg = ''
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
        self.sched = BackgroundScheduler()
        self.sched.add_listener(self.sched_listener,
                                EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
        self.sched.start()
        '''
        Defaults
        '''
        self.escape_key = Key.esc
        self.touch_mode = False
        self.god_speed = False
        self.timezone = 'Asia/Hong_Kong'

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
                    logger.info(res['msg'])

                    self.access_token['expiry_date'] = res['expiry_date']
                else:
                    logger.error(res['msg'])

            sleep(60)

    def send_email(self, type, email):
        return requests.post(self.api_url + 'send-email', {'type': type, 'email': email, 'app_id': self.app_id}).json()

    def login(self, email, pw):
        res = requests.post(self.api_url + 'login',
                            {'email': email, 'pw': pw, 'app_id': self.app_id}).json()

        if res['status']:
            logger.info(res['msg'])

            self.logged_in = True
            self.current_user_email = email

            self.load_or_save_app_config_on_login(email)

            response = requests.post(
                self.api_url + 'access-token', {'email': email, 'pw': pw, 'app_id': self.app_id}).json()

            if response['status']:
                logger.info(response['msg'])

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

    def register(self, first_name, last_name, email, code, pw, referrer, agree_privacy_n_terms, send_update):
        try:
            response = requests.post(self.api_url + 'register', {'1st_name': first_name, 'last_name': last_name, 'email': email,
                                                                 'code': code, 'pw': pw, 'referrer': referrer, 'agree_privacy_n_terms': agree_privacy_n_terms, 'send_update': send_update, 'app_id': self.app_id}).json()

            if response['status']:
                logger.info(response['msg'])

                self.logged_in = True
                self.current_user_email = email

                self.load_or_save_app_config_on_login(email)

                res = requests.post(
                    self.api_url + 'access-token', {'email': email, 'pw': pw, 'app_id': self.app_id}).json()

                if res['status']:
                    logger.info(res['msg'])

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

    def load_settings(self, user_settings, field):
        logger.info('Load {0} from user settings file'.format(field))

        try:
            if field == 'touch_mode':
                self.touch_mode = user_settings[field]
            elif field == 'god_speed':
                self.god_speed = user_settings[field]
            elif field == 'timezone':
                self.timezone = user_settings[field]
        except:
            logger.warning('{0} missing in user settings file'.format(field))

            if field == 'touch_mode':
                self.update_settings_file(field, self.touch_mode)
            elif field == 'god_speed':
                self.update_settings_file(field, self.god_speed)
            elif field == 'timezone':
                self.update_settings_file(field, self.timezone)

    def load_or_save_app_config_on_login(self, email):
        # Create local directory for storing user's process JSON files
        user_processes_path = '{0}/processes/{1}'.format(
            app_file_path, email)
        if not os.path.exists(user_processes_path):
            os.makedirs(user_processes_path)

        # Load or save user's settings
        user_settings_path = '{0}/settings/{1}.json'.format(
            app_file_path, email)
        if os.path.exists(user_settings_path):
            with open(user_settings_path) as f:
                user_settings = json.load(f)

            self.load_settings(user_settings, 'touch_mode')
            self.load_settings(user_settings, 'god_speed')
            self.load_settings(user_settings, 'timezone')
        else:
            user_settings = {'touch_mode': self.touch_mode,
                             'god_speed': self.god_speed,
                             'timezone': self.timezone}

            with open(user_settings_path, 'w') as f:
                json.dump(user_settings, f)

        # Save app user info
        app_info_path = '{0}/Chrono.json'.format(app_file_path)
        with open(app_info_path) as f:
            app = json.load(f)
        app['user'] = email
        with open(app_info_path, 'w') as f:
            json.dump(app, f)

    def reset_pw(self, new_pw, old_pw=None, code=None):
        if old_pw:
            res = requests.post(self.api_url + 'reset-pw', {'new_pw': new_pw, 'old_pw': old_pw,
                                                            'email': self.current_user_email, 'app_id': self.app_id, 'code': self.access_token['code']}).json()

            logger.info(res['msg']) if res['status'] else logger.error(
                res['msg'])
        else:
            res = requests.post(self.api_url + 'reset-pw',
                                {'new_pw': new_pw, 'code': code, 'app_id': self.app_id}).json()

            if res['status']:
                logger.info(res['msg'])

                self.login(res['email'], new_pw)
            else:
                logger.error(res['msg'])

        return res

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
                    sleep(1)

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

    def stop_record(self, msg):
        logger.info('{0}, stop recording'.format(msg))

        self.is_recording = False

    def play(self, process_name, msg=None):
        try:
            if msg:
                logger.info(msg)
            logger.info('Playing process: ' + process_name)

            if not self.is_playing:
                self.is_playing = True
                events = self.load(process_name)

                last_time = None
                for event in events:
                    if not self.is_playing:
                        break

                    logger.info(event)

                    if last_time and not self.god_speed:
                        sleep(event['time'] - last_time)
                    else:
                        sleep(0.05)
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

    def stop_play(self, msg):
        logger.info('{0}, stop playing'.format(msg))

        self.is_playing = False

    def on_press(self, key):
        if self.is_recording:
            logger.info('Pressed {0}'.format(key))

            self.kb_event_handler(key, 'down', time())

    def on_release(self, key):
        if self.is_recording:
            logger.info('Released {0}'.format(key))

            self.kb_event_handler(key, 'up', time())

        if key == self.escape_key:
            if self.is_recording or self.is_playing or self.is_repeating:
                logger.info('Escape key hit')

            self.is_recording = False
            self.is_playing = False
            self.is_repeating = False

    def on_touch(self, x, y):
        if self.touch_mode and self.is_recording:
            logger.info('Touched at {0}'.format((x, y)))

            self.m_event_handler('down', (x, y), time())
            self.m_event_handler('up', (x, y), time())

    def on_click(self, x, y, button, pressed):
        if self.is_recording:
            logger.info('{0} {1} at {2}'.format(
                'Pressed' if pressed else 'Released', button, (x, y)))

            if self.touch_mode:
                self.touch_mode = False

            event_type = 'down' if pressed else 'up'
            self.m_event_handler(event_type, (x, y), time(), button)

    def on_scroll(self, x, y, dx, dy):
        if self.is_recording:
            event_type = 'down' if dy < 0 else 'up'
            logger.info('Scrolled {0} at {1}'.format(event_type, (x, y)))

            if self.touch_mode:
                self.touch_mode = False

            self.m_event_handler(event_type, (x, y), time())

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
                            key=lambda i: i['time'])[:-2]

            events.insert(0, {'owner': self.current_user_email})

            # To do: check file path consistency across OSes
            path = '{0}/processes/{1}/{2}.json'.format(
                app_file_path, self.current_user_email, process)
            if pathlib.Path(path).exists():
                logger.error('Process {0} for user {1} already exists locally.'.format(
                    process, self.current_user_email))

                return {
                    'status': False,
                    'msg': 'Process {0} already exists locally.'.format(process)
                }
            else:
                with open(path, 'w') as f:
                    json.dump(events, f)

                date = timezone(self.timezone).localize(datetime.fromtimestamp(pathlib.Path(
                    '{0}/processes/{1}/{2}.json'.format(app_file_path, self.current_user_email, process)).stat().st_mtime))

                response = requests.post(self.api_url + 'upload-process-meta-data', {
                    'email': self.current_user_email, 'name': process, 'date': date.strftime('%Y-%m-%d %H:%M:%S.%f%z'), 'app_id': self.app_id, 'code': self.access_token['code']}).json()

                if response['status']:
                    logger.info(response['log_msg'])
                else:
                    os.remove(path)

                    logger.error(response['msg'])

                return response
        except Exception as e:
            logger.error('save() error: {0}'.format(str(e)))

    def load(self, process):
        try:
            with open('{0}/processes/{1}/{2}.json'.format(app_file_path, self.current_user_email, process)) as f:
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

            # Check local existence
            new_path = '{0}/processes/{1}/{2}.json'.format(
                app_file_path, self.current_user_email, new_name)
            if pathlib.Path(new_path).exists():
                logger.error('Process {0} for user {1} already exists locally.'.format(
                    new_name, self.current_user_email))

                return {
                    'status': False,
                    'msg': 'Process {0} already exists locally.'.format(new_name)
                }

            response = requests.post(self.api_url + 'rename-process', {
                'email': self.current_user_email, 'old_name': old_name, 'new_name': new_name, 'app_id': self.app_id, 'code': self.access_token['code']}).json()

            if response['status']:
                # Update local process name
                os.rename(
                    '{0}/processes/{1}/{2}.json'.format(app_file_path, self.current_user_email, old_name), new_path)

                logger.info(response['log_msg'])

                return {'status': True, 'msg': response['msg']}
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
                path = '{0}/processes/{1}/{2}.json'.format(
                    app_file_path, self.current_user_email, process)
                if pathlib.Path(path).exists():
                    os.remove(path)

                    logger.info(response['msg'])

                    return response
                else:
                    logger.error('Process {0} does not exist locally for user {1}.'.format(
                        process, self.current_user_email))

                    return {'status': False, 'msg': 'Process {0} does not exist locally.'.format(process)}
            else:
                logger.error(response['msg'])

                return response
        except Exception as e:
            logger.error('del_process() error: {0}'.format(str(e)))

            return {'status': False, 'msg': str(e)}

    def load_process_list(self):
        try:
            res = requests.post(
                self.api_url + 'retrieve-process', {'email': self.current_user_email, 'app_id': self.app_id, 'code': self.access_token['code']}).json()

            if res['status']:
                logger.info(res['msg'])

                process_list = res['process_list']
            else:
                logger.error(res['msg'])

                return []

            for p in process_list:
                p['date'] = datetime.strptime(
                    p['date'], '%Y-%m-%d %H:%M:%S.%f%z').astimezone(timezone(self.timezone))

            # Check against local processes
            _, _, filenames = next(
                os.walk('{0}/processes/{1}/'.format(app_file_path, self.current_user_email)))
            if filenames:
                for n in filenames:
                    with open('{0}/processes/{1}/{2}'.format(app_file_path, self.current_user_email, n)) as f:
                        events = json.load(f)
                    if events[0]['owner'] != self.current_user_email:
                        filenames.remove(n)
                local_process_names = [n[:-5] for n in filenames]

                process_list = [p for p in process_list if p['name'] in local_process_names and p['date'] == datetime.fromtimestamp(pathlib.Path(
                    '{0}/processes/{1}/{2}.json'.format(app_file_path, self.current_user_email, p['name'])).stat().st_mtime, timezone(self.timezone))]
            else:
                return []

            present = datetime.now(timezone(self.timezone))
            for p in process_list:
                if p['date'].year != present.year:
                    p['date'] = p['date'].strftime('%d %b %Y')
                elif p['date'].month != present.month or (p['date'].month == present.month and present.day - p['date'].day >= 7):
                    p['date'] = p['date'].strftime('%d %b')
                elif 0 < present.day - p['date'].day < 7:
                    if present.day - p['date'].day == 1:
                        p['date'] = 'Yesterday'
                    else:
                        p['date'] = p['date'].strftime('%a')
                else:
                    p['date'] = p['date'].strftime('%H:%M')

            logger.info(process_list)

            return process_list
        except Exception as e:
            logger.error('load_process_list() error: {0}'.format(str(e)))

            return []

    def check_app_version(self):
        try:
            logger.info('Check app version')

            return requests.post(self.api_url + 'check-app-version',
                                 {'app_id': self.app_id, 'app_version': self.version}).json()
        except Exception as e:
            logger.error('check_app_version() error: {0}'.format(str(e)))

    def get_touch_mode(self):
        try:
            msg = 'Touch mode {0}'.format(
                'on' if self.touch_mode else 'off')

            logger.info(msg)

            return {'status': True, 'msg': msg, 'touch_mode': self.touch_mode}
        except Exception as e:
            logger.error(
                'get_touch_mode() error: {0}'.formst(str(e)))

            return {'status': False, 'msg': str(e)}

    def get_god_speed(self):
        try:
            msg = 'God speed {0}'.format(
                'on' if self.god_speed else 'off')

            logger.info(msg)

            return {'status': True, 'msg': msg, 'god_speed': self.god_speed}
        except Exception as e:
            logger.error(
                'get_god_speed() error: {0}'.formst(str(e)))

            return {'status': False, 'msg': str(e)}

    def update_settings_file(self, key, value):
        logger.info(
            'Update {0} to {1} in user settings file'.format(key, value))

        user_settings_path = '{0}/settings/{1}.json'.format(
            app_file_path, self.current_user_email)
        with open(user_settings_path) as f:
            user_settings = json.load(f)
        user_settings[key] = value
        with open(user_settings_path, 'w') as f:
            json.dump(user_settings, f)

    def enable_touch_mode(self):
        try:
            if platform.system() == 'Darwin':
                msg = 'Touch mode is not available on macOS yet.'

                logger.warning(msg)

                return {'status': False, 'msg': msg}
            else:
                self.touch_mode = True
                self.update_settings_file('touch_mode', True)
                msg = 'Touch mode enabled'

                logger.info(msg)

                return {'status': True, 'msg': msg}
        except Exception as e:
            logger.error('enable_touch_mode() error: {0}'.format(str(e)))

            return {'status': False, 'msg': str(e)}

    def disable_touch_mode(self):
        try:
            self.touch_mode = False
            self.update_settings_file('touch_mode', False)
            msg = 'Touch mode disabled'

            logger.info(msg)

            return {'status': True, 'msg': msg}
        except Exception as e:
            logger.error('disable_touch_mode() error: {0}'.format(str(e)))

            return {'status': False, 'msg': str(e)}

    def enable_god_speed(self):
        try:
            self.god_speed = True
            self.update_settings_file('god_speed', True)
            msg = 'God speed enabled'

            logger.info(msg)

            return {'status': True, 'msg': msg}
        except Exception as e:
            logger.error('enable_god_speed() error: {0}'.format(str(e)))

            return {'status': False, 'msg': str(e)}

    def disable_god_speed(self):
        try:
            self.god_speed = False
            self.update_settings_file('god_speed', False)
            msg = 'God speed disabled'

            logger.info(msg)

            return {'status': True, 'msg': msg}
        except Exception as e:
            logger.error('disable_touch_mode() error: {0}'.format(str(e)))

            return {'status': False, 'msg': str(e)}

    def get_timezone_list(self):
        return common_timezones

    def get_timezone(self):
        logger.info('Timezone {0}'.format(self.timezone))

        return self.timezone

    def set_timezone(self, timezone):
        try:
            if timezone in common_timezones:
                self.timezone = timezone
                self.update_settings_file('timezone', timezone)
                msg = 'Set timezone to {0}'.format(timezone)

                logger.info(msg)

                return {'status': True, 'msg': msg}
            else:
                raise Exception('Invalid timezone.')
        except Exception as e:
            logger.error('set_timezone() error: {0}'.format(str(e)))

            return {'status': False, 'msg': str(e)}

    def get_user_name(self):
        try:
            res = requests.post(self.api_url + 'get-user-name',
                                {'app_id': self.app_id, 'email': self.current_user_email}).json()

            logger.info(res['msg']) if res['status'] else logger.error(
                res['msg'])

            return res
        except Exception as e:
            logger.error(str(e))

            return {'status': False, 'msg': str(e)}

    def get_user_email(self):
        try:
            logger.info('Retrieved user email: {0}'.format(
                self.current_user_email))

            return {'status': True, 'user_email': self.current_user_email}
        except Exception as e:
            logger.error(str(e))

            return {'status': False, 'msg': str(e)}

    def get_user_license(self):
        try:
            res = requests.post(self.api_url + 'get-user-license', {
                'app_id': self.app_id, 'code': self.access_token['code'], 'email': self.current_user_email}).json()

            logger.info(res['msg']) if res['status'] else logger.error(
                res['msg'])

            return res
        except Exception as e:
            logger.error(str(e))

            return {'status': False, 'msg': str(e)}

    def get_app_info(self):
        try:
            logger.info('Retrieved app version: {0}'.format(self.version))

            return {'status': True, 'version': self.version}
        except Exception as e:
            logger.error(str(e))

            return {'status': False, 'msg': str(e)}

    def thread_handler(self):
        try:
            pag.keyUp('esc')  # Hot fix for macOS thread issue

            with kb_lstner(on_press=self.on_press, on_release=self.on_release) as self.kl, m_lstner(on_move=self.on_touch, on_click=self.on_click, on_scroll=self.on_scroll) as self.ml:
                self.kl.join()
                self.ml.join()
        except Exception as e:
            logger.error('thread_handler() error: {0}'.format(str(e)))

    def on_closed(self):
        logger.info('Chrono closed')

        if platform.system() == 'Windows':
            os.system('taskkill /f /pid %d' % os.getpid())
        else:
            os.system('kill %d' % os.getpid())

        self.sched.shutdown(wait=False)

    def repeat(self, process_name, msg=None):
        try:
            if msg:
                logger.info(msg)

            self.is_repeating = True

            while self.is_repeating:
                self.play(process_name, 'Repeat {0}'.format(process_name))
        except Exception as e:
            logger.error('repeat() error: {0}'.format(str(e)))

    def stop_repeat(self, msg=None):
        if msg:
            logger.info('{0}, stop repeat'.format(msg))
        else:
            logger.info('Stop repeat')

        self.is_playing = False
        self.is_repeating = False

    def sched_listener(self, event):
        if event.exception:
            logger.error('{0} {1}'.format(event.exception, event.traceback))
        else:
            logger.info('Scheduled run of {0} finished'.format(event.job_id))

    def schedule(self, process_name, date_time, predefined_recurrence=None, interval_num=None, interval_unit=None, wk_settings=None, mo_settings=None, day_of_wk_ordinal_num=None, end=None, end_date=None, end_occurrence=None):
        try:
            msg = 'Schedule run of {0} at {1}'.format(process_name, date_time)

            day_of_wk = datetime.strptime(date_time, '%Y-%m-%d %H:%M').strftime('%a')

            if predefined_recurrence:
                if predefined_recurrence == 'immediate':
                    msg += ', repeat immediately'
                elif predefined_recurrence == 'every_min':
                    msg += ', repeat every minute'
                elif predefined_recurrence == 'every_hr':
                    msg += ', repeat every hour'
                elif predefined_recurrence == 'every_day':
                    msg += ', repeat everyday'
                elif predefined_recurrence == 'every_wk':
                    msg += ', repeat every week'
                elif predefined_recurrence == 'every_mo':
                    msg += ', repeat every month'
                elif predefined_recurrence == 'every_yr':
                    msg += ', repeat every year'
            elif interval_num and interval_unit:
                if interval_unit == 'min':
                    if interval_num == '1':
                        msg += ', repeat every minute'
                    else:
                        msg += ', repeat every {0} minutes'.format(interval_num)
                elif interval_unit == 'hr':
                    if interval_num == '1':
                        msg += ', repeat every hour'
                    else:
                        msg += ', repeat every {0} hours'.format(interval_num)
                elif interval_unit == 'day':
                    if interval_num == '1':
                        msg += ', repeat every day'
                    else:
                        msg += ', repeat every {0} days'.format(interval_num)
                elif interval_unit == 'wk':
                    if interval_num == '1':
                        msg += ', repeat every week'
                    else:
                        msg += ', repeat every {0} weeks'.format(interval_num)
                elif interval_unit == 'mo':
                    if interval_num == '1':
                        msg += ', repeat every month'
                    else:
                        msg += ', repeat every {0} months'.format(interval_num)
                elif interval_unit == 'yr':
                    if interval_num == '1':
                        msg += ', repeat every year'
                    else:
                        msg += ', repeat every {0} years'.format(interval_num)

                if interval_unit == 'wk' and wk_settings:
                    wk_settings_days = []
                    for d in wk_settings:
                        wk_settings_days.append(d.capitalize())
                    msg += ' on ' + ', '.join(wk_settings_days)
                elif interval_unit == 'mo' and mo_settings:
                    if mo_settings != 'sameDayEachMo':
                        msg += ' on the {0} {1}'.format(day_of_wk_ordinal_num, day_of_wk)

                if end == 'date' and end_date:
                    msg += ', ends on ' + end_date
                elif end == 'occurrence' and end_occurrence:
                    if end_occurrence == '1':
                        msg += ', ends after {0} occurrence'.format(
                            end_occurrence)
                    else:
                        msg += ', ends after {0} occurrences'.format(
                            end_occurrence)

            # Prepare date_time format
            date_time += ':00'
            month = date_time.split(' ')[0].split('-')[1].lstrip('0')
            day_of_wk = day_of_wk.lower()
            day = date_time.split(' ')[0].split('-')[-1].lstrip('0')
            hour = date_time.split(' ')[1].split(':')[0].lstrip('0')
            minute = date_time.split(' ')[1].split(':')[1].lstrip('0')
            if end == 'occurrence' and end_occurrence:
                end_occurrence = end_occurrence.replace(',', '')

            if not predefined_recurrence and not interval_num:
                # No repeat
                self.sched.add_job(
                    self.play, 'date', run_date=date_time, id=process_name, args=[process_name], name=msg)
            elif predefined_recurrence:
                # Repeat on predefined recurrence
                if predefined_recurrence == 'immediate':
                    self.sched.add_job(
                        self.repeat, 'date', run_date=date_time, id=process_name, args=[process_name], name=msg)
                    self.schedule_repeat_msg = msg
                elif predefined_recurrence == 'every_min':
                    self.sched.add_job(
                        self.play, 'interval', minutes=1, start_date=date_time, id=process_name, args=[process_name], name=msg)
                elif predefined_recurrence == 'every_hr':
                    self.sched.add_job(
                        self.play, 'interval', hours=1, start_date=date_time, id=process_name, args=[process_name], name=msg)
                elif predefined_recurrence == 'every_day':
                    self.sched.add_job(
                        self.play, 'interval', days=1, start_date=date_time, id=process_name, args=[process_name], name=msg)
                elif predefined_recurrence == 'every_wk':
                    self.sched.add_job(
                        self.play, 'interval', weeks=1, start_date=date_time, id=process_name, args=[process_name], name=msg)
                elif predefined_recurrence == 'every_mo':
                    self.sched.add_job(
                        self.play, 'cron', day=day, hour=hour, minute=minute, id=process_name, args=[process_name], name=msg)
                elif predefined_recurrence == 'every_yr':
                    self.sched.add_job(
                        self.play, 'cron', month=month, day=day, hour=hour, minute=minute, id=process_name, args=[process_name], name=msg)
            else:
                # Repeat on custom recurrence
                date_time_dt = datetime.strptime(date_time, '%Y-%m-%d %H:%M:%S')

                if interval_unit == 'min':
                    if end == 'date' and end_date:
                        self.sched.add_job(
                            self.play, 'interval', minutes=int(interval_num), start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                    elif end == 'occurrence' and end_occurrence:
                        end_date = (date_time_dt +
                                    timedelta(minutes=(int(interval_num) * int(end_occurrence)))).strftime('%Y-%m-%d')

                        self.sched.add_job(
                            self.play, 'interval', minutes=int(interval_num), start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                    else:
                        self.sched.add_job(
                            self.play, 'interval', minutes=int(interval_num), start_date=date_time, id=process_name, args=[process_name], name=msg)
                elif interval_unit == 'hr':
                    if end == 'date' and end_date:
                        self.sched.add_job(
                            self.play, 'interval', hours=int(interval_num), start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                    elif end == 'occurrence' and end_occurrence:
                        end_date = (date_time_dt +
                                    timedelta(hours=(int(interval_num) * int(end_occurrence)))).strftime('%Y-%m-%d')

                        self.sched.add_job(
                            self.play, 'interval', hours=int(interval_num), start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                    else:
                        self.sched.add_job(
                            self.play, 'interval', hours=int(interval_num), start_date=date_time, id=process_name, args=[process_name], name=msg)
                elif interval_unit == 'day':
                    if end == 'date' and end_date:
                        self.sched.add_job(
                            self.play, 'interval', days=int(interval_num), start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                    elif end == 'occurrence' and end_occurrence:
                        end_date = (date_time_dt + timedelta(days=(int(interval_num)
                                                                   * int(end_occurrence)))).strftime('%Y-%m-%d')

                        self.sched.add_job(
                            self.play, 'interval', days=int(interval_num), start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                    else:
                        self.sched.add_job(
                            self.play, 'interval', days=int(interval_num), start_date=date_time, id=process_name, args=[process_name], name=msg)
                elif interval_unit == 'wk':
                    if end == 'date' and end_date:
                        self.sched.add_job(self.play, 'cron', week='*/{0}'.format(interval_num), day_of_week=','.join(
                            wk_settings), hour=hour, minute=minute, start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                    elif end == 'occurrence' and end_occurrence:
                        end_date = (date_time_dt + timedelta(weeks=(int(interval_num)
                                                                    * int(end_occurrence)))).strftime('%Y-%m-%d')

                        self.sched.add_job(self.play, 'cron', week='*/{0}'.format(interval_num), day_of_week=','.join(
                            wk_settings), hour=hour, minute=minute, start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                    else:
                        self.sched.add_job(self.play, 'cron', week='*/{0}'.format(interval_num), day_of_week=','.join(
                            wk_settings), hour=hour, minute=minute, start_date=date_time, id=process_name, args=[process_name], name=msg)
                elif interval_unit == 'mo':
                    if mo_settings == 'sameDayEachMo':
                        day = date_time.split(' ')[0].split('-')[-1].lstrip('0')

                        if end == 'date' and end_date:
                            self.sched.add_job(self.play, 'cron', month='*/{0}'.format(
                                interval_num), day=day, hour=hour, minute=minute, start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                        elif end == 'occurrence' and end_occurrence:
                            end_date = (date_time_dt + relativedelta(months=(int(interval_num)
                                                                             * int(end_occurrence)))).strftime('%Y-%m-%d')

                            self.sched.add_job(self.play, 'cron', month='*/{0}'.format(
                                interval_num), day=day, hour=hour, minute=minute, start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                        else:
                            self.sched.add_job(self.play, 'cron', month='*/{0}'.format(
                                interval_num), day=day, hour=hour, minute=minute, start_date=date_time, id=process_name, args=[process_name], name=msg)
                    else:
                        if end == 'date' and end_date:
                            self.sched.add_job(self.play, 'cron', month='*/{0}'.format(
                                interval_num), day='{0} {1}'.format(day_of_wk_ordinal_num, day_of_wk), hour=hour, minute=minute, start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                        elif end == 'occurrence' and end_occurrence:
                            end_date = (date_time_dt + relativedelta(months=(int(interval_num)
                                                                             * int(end_occurrence)))).strftime('%Y-%m-%d')

                            self.sched.add_job(self.play, 'cron', month='*/{0}'.format(
                                interval_num), day='{0} {1}'.format(day_of_wk_ordinal_num, day_of_wk), hour=hour, minute=minute, start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                        else:
                            self.sched.add_job(self.play, 'cron', month='*/{0}'.format(
                                interval_num), day='{0} {1}'.format(day_of_wk_ordinal_num, day_of_wk), hour=hour, minute=minute, start_date=date_time, id=process_name, args=[process_name], name=msg)
                elif interval_unit == 'yr':
                    if end == 'date' and end_date:
                        self.sched.add_job(self.play, 'cron', year='*/{0}'.format(interval_num), month=month, day=day,
                                           hour=hour, minute=minute, start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                    elif end == 'occurrence' and end_occurrence:
                        end_date = (date_time_dt + relativedelta(years=(int(interval_num)
                                                                        * int(end_occurrence)))).strftime('%Y-%m-%d')

                        self.sched.add_job(self.play, 'cron', year='*/{0}'.format(interval_num), month=month, day=day,
                                           hour=hour, minute=minute, start_date=date_time, end_date=end_date, id=process_name, args=[process_name], name=msg)
                    else:
                        self.sched.add_job(self.play, 'cron', year='*/{0}'.format(interval_num), month=month, day=day,
                                           hour=hour, minute=minute, start_date=date_time, id=process_name, args=[process_name], name=msg)

            logger.info(msg)

            return {'status': True, 'msg': msg}
        except Exception as e:
            logger.error('schedule() error: {0}'.format(str(e)))

            return {'status': False, 'msg': str(e)}

    def cancel_scheduled_task(self, process_name, msg):
        try:
            logger.info(msg)

            try:
                self.sched.remove_job(process_name)
            except:
                self.stop_repeat()

            msg = 'Scheduled task cancelled'

            logger.info(msg)

            return {'status': True, 'msg': msg}
        except Exception as e:
            logger.error('cancel_scheduled_task() error: {0}'.format(str(e)))

            return {'status': False, 'msg': str(e)}

    def get_schedule_details(self, process_name):
        try:
            job = self.sched.get_job(process_name)
            msg = '{0}.'.format(job.name if job else self.schedule_repeat_msg)

            logger.info('Retrieved schedule details: {0}'.format(msg))

            return {'status': True, 'msg': msg}
        except Exception as e:
            logger.error('get_schedule_details() error: {0}'.format(str(e)))

            return {'status': False, 'msg': str(e)}

    def is_schedule_on(self, process_name):
        try:
            job = self.sched.get_job(process_name)

            while job or self.is_repeating:
                sleep(1)
                job = self.sched.get_job(process_name)

            logger.info('Revert schedule btn to normal')
        except Exception as e:
            logger.error('is_schedule_on() error: {0}'.format(str(e)))


if __name__ == '__main__':
    api = Api()
    api.window = webview.create_window('Chrono', 'assets/ac.html', js_api=api)
    api.window.closed += api.on_closed
    webview.start(api.thread_handler, debug=True)
