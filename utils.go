package main

func checkError(e error) {
	if e != nil {
		panic(e)
	}
}
