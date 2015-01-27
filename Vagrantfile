# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network "forwarded_port", guest: 8080, host: 8080

  config.vm.provision "ansible" do |ansible|
    ansible.playbook = "devops/ansible/playbook.yml"
    ansible.verbose = "v"
  end
end
