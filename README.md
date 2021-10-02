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

### Universal

```bash
# Chrono
pyinstaller Chrono.spec

# Upgrader for Windows
pyinstaller Upgrader.spec
```

### Linux

```bash
pyinstaller --onefile --windowed --add-data 'assets:assets' --hidden-import plyer.platforms.linux.notification --hidden-import geocoder main.py -n Chrono -i media/automation.png -p venv/lib/python3.8/site-packages/:venv/lib64/python3.8/site-packages/
```

### macOS

```bash
pyinstaller --onefile --windowed --add-data 'assets:assets' --hidden-import geocoder main.py -n Chrono -i media/automation.png -p venv/lib/python3.9/site-packages
```

### Windows

```bash
# Chrono
pyinstaller --onefile --windowed --add-data 'assets;assets' --hidden-import plyer.platforms.win.notification --hidden-import apscheduler --hidden-import geocoder main.py -n Chrono -i media/automation.ico

# Upgrader
pyinstaller --onefile upgrader.py -n Upgrader
```

## Remarks

1.  In Windows, some apps may swallow the ButtonEvent generated by touch. ButtonEvent generated by mouse click is not affected

2.  In JS, if there are more than 1 pywebview.api calls, we need to use <b>setTimeout()</b> to spread out them chronologically

3.  In macOS, need to open up certain privacy settings, e.g. Input Monitoring, to Chrono for it to work

4.  In Ubuntu, running as admin is unnecessary & unavailable
