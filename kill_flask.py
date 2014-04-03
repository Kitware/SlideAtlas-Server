import os
import subprocess
import signal

def kill_flask():
    try:
        lines = subprocess.check_output(["lsof","-i",":8080"], stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        print "No one listening at port 8080"
        assert e.returncode == 1
        return

    processid = lines.split()[10]
    try:
        os.kill(int(processid), signal.SIGKILL)
        print "Killed ", processid
    except:
        print "Found ", processid, " but could not kill"

if __name__ == "__main__":
    kill_flask()
