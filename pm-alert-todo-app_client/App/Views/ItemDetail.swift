import SwiftUI
import RealmSwift


/// Show a detail view of a task Item. User can edit the summary or mark the Item complete.
struct ItemDetail: View {
    // This property wrapper observes the Item object and
    // invalidates the view when the Item object changes.
    @ObservedRealmObject var item: machine_failure
    
    var body: some View {
        Form {
            Section (header: Text("Machine ID")) {
                Text(item.machineID)
            }
            Section(header: Text("Failure Type"))  {
                Text(item.failure)
            }
            Section (header: Text("Time Stamp")) {
                Text(item.ts, format: Date.FormatStyle().year().month().day().weekday().hour().minute().second().timeZone())
            }
            Section {
                Toggle(isOn: $item.isAcknowledged) {
                    Text("Acknowledge")
                }
            }
           Section (header: Text("Repair Steps")) {
                Text(item.repairSteps)
            }
        }
        .navigationBarTitle("Alert Details", displayMode: .inline)
    }
}
