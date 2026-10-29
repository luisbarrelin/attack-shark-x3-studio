"""Studio regressions: no device calls, no hooks, no system changes."""
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from attackshark import server, studio_preferences

class StudioTests(unittest.TestCase):
    def test_preview_never_enumerates_mouse(self):
        with patch.object(server,'_preview',True), patch.object(server.AttackSharkX3,'discover',side_effect=AssertionError('hardware access')):
            self.assertEqual(server._device_info(),{'connected':False,'preview':True})

    def test_first_launch_does_not_push_defaults(self):
        with patch.object(server.os.path,'isfile',return_value=False), patch.object(server.AttackSharkX3,'discover',side_effect=AssertionError('hardware access')), patch.object(server,'_push_state',side_effect=AssertionError('write')):
            self.assertFalse(server.resync_device())

    def test_preferences_validate_language_and_preserve_other_fields(self):
        with tempfile.TemporaryDirectory(prefix='studio-prefs-') as folder:
            with patch.object(studio_preferences,'PATH',Path(folder)/'prefs.json'):
                studio_preferences.update(port=7342,language='pt-BR')
                studio_preferences.update(language='en')
                self.assertEqual(studio_preferences.load(),{'port':7342,'language':'en'})
                with self.assertRaises(ValueError):studio_preferences.update(language='../invalid')
                self.assertEqual(studio_preferences.load()['language'],'en')

if __name__=='__main__':unittest.main()
