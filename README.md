# Chrono

A process recorder

## Author

Cronumax dev team

## License

Commercial

## Dependencies

Keep version for the following packages,

| Package    | Version | Rationale              |
| ---------- | ------- | ---------------------- |
| **idna**   | 2.10    | Compatible w/ requests |
| **pynput** | 1.6.8   | Avoid Xorg error       |

otherwise, use the latest.

## Get Started

### Linux

```bash
source venv/bin/activate
pip install -r linux_requirements.txt
xhost +
```

### macOS

```bash
source venv/bin/activate
pip install -r macos_requirements.txt
```

### Windows

```bash
. venv/Scripts/activate
pip install -r windows_requirements.txt
```

## Distribute

### Linux

```bash
pyinstaller chrono.spec

# OR

pyinstaller --onefile --windowed --add-data 'assets:assets' --hidden-import plyer.platforms.linux.notification --hidden-import geocoder main.py -n chrono -i media/automation.png --copy-metadata pytz --copy-metadata six --copy-metadata tzlocal
```

### macOS

```bash
pyinstaller Chrono.spec

# OR

pyinstaller --onefile --windowed --add-data 'assets:assets' --hidden-import geocoder main.py -n Chrono -i media/automation.png --copy-metadata pytz --copy-metadata six --copy-metadata tzlocal
```

### Windows

```bash
# Chrono
pyinstaller Chrono.spec

# OR

pyinstaller --onefile --windowed --add-data 'assets;assets' --hidden-import plyer.platforms.win.notification --hidden-import apscheduler --hidden-import geocoder main.py -n Chrono -i media/automation.ico --copy-metadata pytz --copy-metadata six --copy-metadata tzlocal

# Upgrader
pyinstaller Upgrader.spec

# OR

pyinstaller --onefile upgrader.py -n Upgrader
```

## Remarks

1.  On Windows, some apps may swallow the ButtonEvent generated by touch. ButtonEvent generated by mouse click is not affected

2.  In JS, if there are more than 1 pywebview.api calls, we need to use <b>setTimeout()</b> to spread out them chronologically

3.  On macOS, for Chrono to work properly, go to System Preferences -> Security & Privacy, add & check Chrono to Accessibility, Input Monitoring & Screen Recording

4.  On Ubuntu, running as admin is unnecessary & unavailable
