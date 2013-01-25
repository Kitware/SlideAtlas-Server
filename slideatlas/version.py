from subprocess import check_output

def get_git_name():
    out = ''
    try:
        params = ["git", "describe", "--tags"]
        out = check_output(params)
    except:
        # Support for particular case when running on windows 
        params = ["C:/PortableGit-1.7.11/bin/git", "describe", "--tags"]
        out = check_output(params)

    return out

if __name__ == "__main__":
    print get_git_name()
