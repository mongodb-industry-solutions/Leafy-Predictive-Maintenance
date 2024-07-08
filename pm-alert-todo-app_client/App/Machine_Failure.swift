//
//  Machine_Failure.swift
//  App
//
//  Created by Humza Akhtar on 2024-03-10.
//

import Foundation
import RealmSwift

class machine_failure: Object,ObjectKeyIdentifiable {
    @Persisted(primaryKey: true) var _id: ObjectId

    @Persisted var failure: String

    @Persisted var isAcknowledged: Bool

    @Persisted var machineID: String
    
    @Persisted var repairSteps: String

    @Persisted var ts: Date
}
