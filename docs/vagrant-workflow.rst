Development / Deployment with Vagrant
=====================================

- Install latest `vagrant <https://www.vagrantup.com/downloads.html>`_
- Install latest `virtualbox <https://www.virtualbox.org/wiki/Downloads>`_
- Ansible is required

To create a virtual machine, run the following command from the root of the SlideAtlas checkout.

.. code-block:: shell-session

    $ cd <path-to-slideatlas-checkout>
    $ vagrant up

For first time, this will download `ubuntu 14.04 base image (362 mb) <https://cloud-images.ubuntu.com/vagrant/trusty/current/trusty-server-cloudimg-amd64-vagrant-disk1.box>`_, so it might take a while.

First time, vagrant will provision the created VM using ansible. The cofiguration is stored in "devops" folder. Provisioning step will install mongodb, build tools and SlideAtlas dependencies.  

Vagrant maps the local development folder from host to /var/vagrant. So running the SlideAtlas server involves -

.. code-block:: shell-session

    $ vagrant ssh
    $ cd /vagrant
    $ python run.py

Port 8080 from host is forward to the virtual machine. Hence the SlideAtlas can be accessed from  

After everything goes well, shell session on the virtual machine can be access via 

.. code-block:: shell-session

    $ vagrant ssh

Now the web server is available at `http://localhost:8080/ <http://localhost:8080/>`_

During development any changes to the files in the host, or the corresponding "/vagrant" take effect immediately.

.. warning:: 
	Right now the SlideAtlas connects with empty administrative database. This will change in the future.


