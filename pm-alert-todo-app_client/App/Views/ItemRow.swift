import SwiftUI
import RealmSwift

struct ItemRow: View {
    @ObservedRealmObject var item: machine_failure
    
    var body: some View {
        NavigationLink(destination: ItemDetail(item: item)) {
            Text(item.failure)
            Spacer()
            if item.isAcknowledged {
                Image(systemName: "checkmark")
                    .foregroundColor(.blue)
                    .padding(.trailing, 10)
            }
            //if item.machineID == app.currentUser?.id {
            //    Text("(mine)")
            //}
        }
    }
}
