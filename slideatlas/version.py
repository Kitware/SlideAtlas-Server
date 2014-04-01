# coding=utf-8

import inspect
import os
import subprocess

import slideatlas

################################################################################
__all__ = ('get_version',)


################################################################################
def get_version():
    version = None

    try:
        version = git_describe()

    except OSError:  # command couldn't run at all
        try:
            # Support for particular case when running on windows
            version = git_describe('C:/PortableGit-1.7.11/bin/git.exe')
        except (OSError, subprocess.CalledProcessError):
            pass

    except subprocess.CalledProcessError:  # command returned non-zero exit status
        # try to look for a magic file with the version
        version_file_path = os.path.join(get_site_path(), 'version.txt')
        if os.path.isfile(version_file_path):
            try:
                with open(version_file_path, 'r') as version_file:
                    version = version_file.readline().strip()
            except (IOError, OSError):
                pass

    if not version:
        version = '<unknown_version>'
    return version


################################################################################
def get_site_path():
    site_init_path = os.path.abspath(inspect.getfile(slideatlas))
    return os.path.dirname(site_init_path)


################################################################################
def git_describe(git_exec='git'):
    cmd = [git_exec, 'describe', '--tags', '--always']
    return subprocess.check_output(cmd, cwd=get_site_path()).strip()
