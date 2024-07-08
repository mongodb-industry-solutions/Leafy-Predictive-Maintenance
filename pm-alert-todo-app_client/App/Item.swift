import RealmSwift

class Item: Object, ObjectKeyIdentifiable {
    @Persisted(primaryKey: true) var _id: ObjectId
    @Persisted var isComplete = false
    @Persisted var summary: String
    @Persisted var owner_id: String
    @Persisted var priority: PriorityLevel
}

enum PriorityLevel: Int, PersistableEnum, CaseIterable {
   case high = 0
   case medium = 1
   case low = 2
   var description: String {
      switch self {
      case .high: return "High"
      case .medium: return "Medium"
      case .low: return "Low"
      }
   }
}
