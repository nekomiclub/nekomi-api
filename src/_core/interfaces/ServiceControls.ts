interface ServiceControls<CREATE, OUT_DOC> {
  /** Create the document */
  create(props: CREATE): Promise<OUT_DOC>
  /** Delete the document */
  deleteOne(id: string): Promise<void>
  /** Delete many documents with same id */
  deleteMany(id: string): Promise<void>
  /** Get document by id */
  getById(id: string, details?: boolean): Promise<OUT_DOC>
  /** Get document by slug, code, etc */
  getByQuery(query: string, details?: boolean): Promise<OUT_DOC>
  /** Get list of all documents */
  getAll(details?: boolean): Promise<OUT_DOC[]>
}



export default ServiceControls;