#!/bin/bash
renewal_result="$(command certbot renew  --webroot -w /home/alex/ddw-external-api/letsencrypt)"
#Check if successful result is received
result="$(echo $renewal_result | grep -o Congratulations )"

#If successful copy certs to the correct folder and refresh nginx docker node
if [ $result ]; then
        cd /home/alex/ddw-external-api/
        cp -f  /etc/letsencrypt/live/api.devinit.org/privkey.pem /home/alex/ddw-external-api/ssl/
        cp -f /etc/letsencrypt/live/api.devinit.org/fullchain.pem /home/alex/ddw-external-api/ssl/

        command docker-compose restart nginx
fi
