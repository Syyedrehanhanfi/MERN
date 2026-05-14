class ApiResponse {
  constructor(
    {
      statusCode,
      message = "Succes",
      data
    }
  ){
       this.message = message
       this.statusCode = statusCode,
       this.data = data,
       this.success = statusCode < 400
  }
}

export {ApiResponse}