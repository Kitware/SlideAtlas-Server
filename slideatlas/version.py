import os
from subprocess import check_output

def get_git_name():
    curdir = os.getcwd()
    newdir = os.path.dirname(os.path.abspath(__file__))
    out = ''
    try:
        params = ["git", "describe", "--tags", "--always"]
        out = check_output(params)
    except:
        # Support for particular case when running on windows 
        os.chdir(newdir)
        params = ["C:/PortableGit-1.7.11/git", "describe", "--tags"]
        out = check_output(params)
        os.chdir(curdir)

    os.chdir(newdir)
    return out

if __name__ == "__main__":
    print get_git_name()
