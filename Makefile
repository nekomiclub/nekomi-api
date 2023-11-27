build:
	docker rmi unniiiverse/animee_core && docker build -t unniiiverse/animee_core .

run:
	docker run -d -p 0.0.0.0:54320:54320 --name animee_core_c unniiiverse/animee_core

stop:
	docker stop animee_core_c && docker rm animee_core_c

push:
	docker push unniiiverse/animee_core