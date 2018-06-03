![Logo](admin/syncthing.png)
# ioBroker.syncthing
=================

ioBroker Adapter to load meta data of a folder of your Syncthing server. 
The adapter loads every 5 minutes (default) the amount of bytes of the global folder (the data within the cloud), of your local folder and the state of the folder (e.g. idle).
Additionally it reformates the bytes to a more readable string (e.g. '3.376 KB' instead of '2433') besides the original value.

## What is Syncthing?
Quoted from the official website: Syncthing replaces proprietary sync and cloud services with something open, trustworthy and decentralized. Your data is your data alone and you deserve to choose where it is stored, if it is shared with some third party and how it's transmitted over the Internet.
Private. None of your data is ever stored anywhere else other than on your computers. There is no central server that might be compromised, legally or illegally.
Encrypted. All communication is secured using TLS. The encryption used includes perfect forward secrecy to prevent any eavesdropper from ever gaining access to your data.
Authenticated. Every node is identified by a strong cryptographic certificate. Only nodes you have explicitly allowed can connect to your cluster.

See [the official Syncthing website](https://syncthing.net/)

## Notes 
1. An API Key of the Syncthing installation is necessary to use this adapter to load the data of your Syncthing folder. To find it load your Syncthing admin overview (typically the IP of your syncthing installation on port 8080) and go to 'Actions' -> 'Advanced'. Make sure you don't share your API key.
2. The Folder ID of your Syncthing folder can be found in the Syncthing admin overview when you expand the Folder on the main overview. You'll find 'Folder ID' below the expanded folder.

## Changelog

#### 0.1.1
* (joergzdarsky) fixed version with scheduler mode and correct adapter.stop handling (after the request).

#### 0.1.0
* (joergzdarsky) initial release.

## License
The MIT License (MIT)

Copyright (c) 2017 Joerg Zdarsky <joerg.zdarsky@gmx.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
