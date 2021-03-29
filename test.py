import keyboard as kb
import json
import time


def record():
    kb_events = []
    raw_kb_events = kb.record()

    for e in raw_kb_events:
        kb_events.append(json.loads(e.to_json()))

    with open('events.json', 'w') as f:
        json.dump(kb_events, f)


def play(speed_factor=1):
    # Hot fix for missing 1st event
    kb.unhook(kb.hook(set().add))

    with open('events.json') as f:
        kb_events = json.load(f)

    state = kb.stash_state()

    last_time = None
    for event in kb_events:
        if speed_factor > 0 and last_time is not None:
            time.sleep((event['time'] - last_time) / speed_factor)
        last_time = event['time']

        key = event['scan_code'] or event['name']
        if event['event_type'] == kb.KEY_DOWN:
            print('Press ' + str(key))
            kb.press(key)
        else:
            print('Release ' + str(key))
            kb.release(key)

    kb.restore_modifiers(state)


if __name__ == '__main__':
    # record()
    play()
