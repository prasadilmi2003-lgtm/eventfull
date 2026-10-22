import Notification from '../models/Notification.js'

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    })

    return res.status(200).json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    next(error)
  }
}

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params
    const notification = await Notification.findOne({ _id: id, userId: req.user._id })
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    notification.read = true
    await notification.save()

    return res.status(200).json({ message: 'Notification marked as read', notification })
  } catch (error) {
    next(error)
  }
}

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } })
    return res.status(200).json({ message: 'All notifications marked as read' })
  } catch (error) {
    next(error)
  }
}
