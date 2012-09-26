import os
import subprocess

def kill_flask():
    try:
        lines = subprocess.check_output(["lsof","-i",":8080"], stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        print "No one listening at port 8080"
        assert e.returncode == 1
        
    processid = lines.split()[10]
    print processid
    
if __name__ == "__main__":
    kill_flask()
    