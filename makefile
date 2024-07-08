build:
	docker-compose up --build -d

start: 
	docker-compose start
	
stop:
	docker-compose stop
	
clean:
	docker-compose down --rmi all -v

open:
	open http://localhost:3000